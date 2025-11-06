import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { angle, rollingVariance, normalize } from "../lib/angles";
import { drawRibbon } from "../lib/ribbon";

const MOVE_NET = poseDetection.SupportedModels.MoveNet;

export default function PoseDetector({ onScore }: { onScore: (s: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const ribbonRef = useRef<HTMLCanvasElement>(null);

  const [detector, setDetector] = useState<poseDetection.PoseDetector>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      // Make sure TFJS backend is ready before anything else
      await tf.setBackend("webgl");
      await tf.ready();

      const det = await poseDetection.createDetector(MOVE_NET, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });
      setDetector(det);
      await setupCamera();
    })();
  }, []);

  async function setupCamera() {
    const v = videoRef.current!;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    v.srcObject = stream;

    // ✅ Wait for actual dimensions
    await new Promise<void>((resolve) => {
      if (v.readyState >= 1) return resolve();
      v.onloadedmetadata = () => resolve();
    });

    // Use intrinsic video dimensions
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 480;

    v.width = vw;
    v.height = vh;
    await v.play();

    const ov = overlayRef.current!;
    ov.width = vw;
    ov.height = vh;

    const rb = ribbonRef.current!;
    rb.width = 400;
    rb.height = 40;
  }

  useEffect(() => {
    if (detector) loop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detector]);

  async function loop() {
    if (running) return;
    setRunning(true);

    const v = videoRef.current!;
    const ov = overlayRef.current!;
    const rb = ribbonRef.current!;

    const ctx = ov.getContext("2d", { willReadFrequently: true })!;
    const rcx = rb.getContext("2d", { willReadFrequently: true })!;

    const angleSeries: number[] = [];

    async function frame() {
      // ⛔️ Guard: skip until video has real size
      if (
        v.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !v.videoWidth ||
        !v.videoHeight
      ) {
        requestAnimationFrame(frame);
        return;
      }

      // Estimate poses on the video element
      const poses = await detector!.estimatePoses(v, {
        flipHorizontal: false,
        maxPoses: 1,
      });

      ctx.clearRect(0, 0, ov.width, ov.height);

      if (poses[0]) {
        const p = poses[0];
        drawPose(ctx, p);
        const a = computePrimaryAngle(p);
        angleSeries.push(a);

        const varSeries = rollingVariance(angleSeries, 30);
        const vNow = varSeries[varSeries.length - 1] || 0;
        const heat = normalize(vNow, 0, 400); // tune per exercise
        drawRibbon(rcx, heat, 2);
        onScore(1 - heat);
      }

      requestAnimationFrame(frame);
    }

    frame();
  }

  return (
    <div className="space-y-2">
      <div className="relative inline-block">
        <video ref={videoRef} className="rounded-xl" muted playsInline />
        <canvas ref={overlayRef} className="absolute left-0 top-0" />
      </div>
      <div>
        <canvas ref={ribbonRef} className="rounded" />
      </div>
    </div>
  );
}

// ——— helpers ———
function drawPose(ctx: CanvasRenderingContext2D, p: poseDetection.Pose) {
  const k = p.keypoints;
  ctx.strokeStyle = "rgba(0,255,255,0.8)";
  ctx.lineWidth = 2;
  const pairs: [number, number][] = [
    [5, 7], [7, 9], [6, 8], [8, 10],
    [11, 13], [13, 15], [12, 14], [14, 16],
    [5, 6], [11, 12], [5, 11], [6, 12],
  ];
  pairs.forEach(([i, j]) => {
    const a = k[i], b = k[j];
    if (a && b && (a.score ?? 0) > 0.2 && (b.score ?? 0) > 0.2) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  });
}

function computePrimaryAngle(p: poseDetection.Pose) {
  const k = p.keypoints as any[];
  const L = qa(k, 11, 13, 15); // left hip–knee–ankle
  const R = qa(k, 12, 14, 16); // right hip–knee–ankle
  return (L.conf > R.conf ? L.ang : R.ang) || 0;
}
function qa(k: any[], a: number, b: number, c: number) {
  const A = k[a], B = k[b], C = k[c];
  const conf = (A?.score || 0) + (B?.score || 0) + (C?.score || 0);
  const ang = A && B && C ? angle(A, B, C) : 0;
  return { ang, conf };
}

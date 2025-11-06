import React, { useRef, useState } from "react";
import PoseDetector from "./pose/PoseDetector";
import { Metronome } from "./lib/metronome";
import { exportCanvasGif } from "./lib/gifExport";

export default function App() {
  const [bpm, setBpm] = useState(40);
  const [score, setScore] = useState(0);

  const metro = useRef<Metronome | null>(null);
  const [bestBlob, setBestBlob] = useState<Blob | null>(null);
  const [bestScore, setBestScore] = useState(0);

  function onScore(s: number) {
    setScore(s);
  }

  const toggleMetro = () => {
    if (!metro.current) metro.current = new Metronome(bpm);
    const flag = (metro.current as any)._on || false;

    if (flag) {
      metro.current.stop();
      (metro.current as any)._on = false;
    } else {
      metro.current.setBpm(bpm);
      metro.current.start();
      (metro.current as any)._on = true;
    }
  };

  async function captureGif() {
    const c = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!c) return;

    const blob = await exportCanvasGif(c, 4, 12);
    if (score > bestScore) {
      setBestScore(score);
      setBestBlob(blob);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "technique-heatmap.gif";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grad-1 blur-3xl opacity-40 animate-float-1" />
        <div className="bg-grad-2 blur-3xl opacity-30 animate-float-2" />
        <div className="bg-grad-3 blur-3xl opacity-20 animate-float-3" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Pose Coach Remix
            </h1>
            <p className="text-xs/4 text-slate-300">
              Technique Heatmap • Local • No Cloud
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Badge>TF.js</Badge>
          <Badge>MoveNet</Badge>
          <Badge>WebGL</Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-12 md:grid-cols-3">
        {/* Video + overlay + ribbon */}
        <section className="md:col-span-2">
          <Card className="p-3">
            <div className="relative">
              {/* PoseDetector renders the video + overlay + ribbon */}
              <PoseDetector onScore={onScore} />
            </div>
          </Card>

          {/* Legend / Tips */}
          <Card className="mt-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ColorSwatch label="Stable" from="from-emerald-400" to="to-emerald-600" />
                <ColorSwatch label="Drift" from="from-red-400" to="to-red-600" />
              </div>
              <p className="text-xs text-slate-300">
                Ribbon shows per-frame variance: green → stable, red → drift. Aim for long green runs synced to tempo.
              </p>
            </div>
          </Card>
        </section>

        {/* Right controls */}
        <aside className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-200">Tempo (BPM)</h2>
            <input
              type="range"
              min={20}
              max={120}
              value={bpm}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setBpm(v);
                if (metro.current) metro.current.setBpm(v);
              }}
              className="range w-full accent-emerald-400"
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">Slow</span>
              <span className="font-semibold">{bpm} BPM</span>
              <span className="text-slate-300">Fast</span>
            </div>
            <button
              onClick={toggleMetro}
              className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Toggle Metronome
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Tip: Try 40–60 BPM for hypertrophy time-under-tension.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-200">Technique Stability</h2>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-semibold tracking-tight">
                  {(score * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-slate-400">Higher is steadier</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 px-3 py-1 text-xs font-medium ring-1 ring-emerald-400/30">
                Live
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-200">Export</h2>
            <button
              onClick={captureGif}
              className="w-full rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Export GIF (last few sec)
            </button>

            {bestBlob && (
              <div className="mt-3 text-xs">
                Best set:{" "}
                <span className="font-semibold">{(bestScore * 100).toFixed(0)}%</span>{" "}
                —{" "}
                <a
                  className="underline"
                  href={URL.createObjectURL(bestBlob)}
                  download
                >
                  download best
                </a>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-200">Coach Notes (examples)</h2>
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
              <li>Keep knees tracking over toes—reduce wobble at the bottom.</li>
              <li>Match the down phase to two ticks; hold one tick at depth.</li>
              <li>If ribbon spikes red, slow the concentric by one beat.</li>
            </ul>
          </Card>
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-center text-xs text-slate-400">
        Built with React · Tailwind · TF.js MoveNet · Local-only demo
      </footer>
    </div>
  );
}

/* ——— UI helpers ——— */

function Card({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={[
        "rounded-2xl",
        "bg-white/[0.06]",
        "backdrop-blur-md",
        "ring-1 ring-white/15",
        "shadow-xl shadow-black/30",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Badge({ children }: React.PropsWithChildren) {
  return (
    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide ring-1 ring-white/15">
      {children}
    </span>
  );
}

function ColorSwatch({
  label,
  from,
  to,
}: {
  label: string;
  from: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-10 rounded bg-gradient-to-r ${from} ${to}`} />
      <span className="text-xs text-slate-300">{label}</span>
    </div>
  );
}

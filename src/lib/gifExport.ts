import GIF from "gif.js";
import workerUrl from "gif.js/dist/gif.worker.js?url";

export async function exportCanvasGif(
  canvas: HTMLCanvasElement,
  seconds = 5,
  fps = 10
): Promise<Blob> {
  const gif = new (GIF as any)({
    workers: 2,
    quality: 10,
    workerScript: workerUrl,
  });

  const interval = 1000 / fps;
  const frames = Math.floor(seconds * fps);

  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;
  const offctx = off.getContext("2d", { willReadFrequently: true })!;

  for (let i = 0; i < frames; i++) {
    offctx.drawImage(canvas, 0, 0);
    gif.addFrame(off, { delay: interval, copy: true });
    await new Promise((r) => setTimeout(r, interval));
  }
  return new Promise((resolve) => {
    gif.on("finished", (blob: Blob) => resolve(blob));
    gif.render();
  });
}

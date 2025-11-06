export function drawRibbon(ctx: CanvasRenderingContext2D, value: number, width = 2) {
  const h = ctx.canvas.height;
  const anyCtx = ctx as CanvasRenderingContext2D & { _x?: number };
  const x = anyCtx._x ?? 0;

  const color = lerpColor([34, 197, 94], [220, 38, 38], value); // green->red
  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
  ctx.fillRect(x, 0, width, h);

  anyCtx._x = (x + width) % ctx.canvas.width;
}

function lerpColor(a: number[], b: number[], t: number) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

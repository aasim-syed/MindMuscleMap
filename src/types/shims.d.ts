// Allow importing gif.js without @types
declare module "gif.js" {
  const GIF: any;
  export default GIF;
}

// Let Vite's ?url worker import be typed
declare module "gif.js/dist/gif.worker.js?url" {
  const url: string;
  export default url;
}

// Extend CanvasRenderingContext2D for our private cursor property
declare interface CanvasRenderingContext2D {
  _x?: number;
}

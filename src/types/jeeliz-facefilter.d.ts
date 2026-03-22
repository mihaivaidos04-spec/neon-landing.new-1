export interface JeelizDetectState {
  detected: number;
  x: number;
  y: number;
  s: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

export interface JeelizReadySpec {
  GL: WebGLRenderingContext;
  canvasElement: HTMLCanvasElement;
  videoTexture: WebGLTexture;
  videoTransformMat2: Float32Array;
  videoElement?: HTMLVideoElement;
}

export interface JeelizCanvas2DHelperInstance {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  update_canvasTexture: () => void;
  draw: () => void;
  getCoordinates: (d: JeelizDetectState) => { x: number; y: number; w: number; h: number };
  resize: () => void;
}

export interface JeelizFaceFilterInitOptions {
  canvasId?: string;
  canvas?: HTMLCanvasElement;
  NNCPath: string;
  callbackReady?: (err: string | false | null, spec?: JeelizReadySpec) => void;
  callbackTrack?: (detectState: JeelizDetectState) => void;
  videoSettings?: {
    videoElement?: HTMLVideoElement;
    facingMode?: string;
    idealWidth?: number;
    idealHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    rotate?: number;
    flipX?: boolean;
  };
  maxFacesDetected?: number;
  followZRot?: boolean;
}

export interface JeelizFaceFilterGlobal {
  VERSION?: string;
  init: (options: JeelizFaceFilterInitOptions) => boolean;
  destroy: () => Promise<void>;
  resize?: () => boolean;
  render_video?: () => void;
  update_videoElement?: (video: HTMLVideoElement | null, callback?: () => void) => void;
}

declare global {
  interface Window {
    JEELIZFACEFILTER?: JeelizFaceFilterGlobal;
    JeelizCanvas2DHelper?: (spec: JeelizReadySpec) => JeelizCanvas2DHelperInstance;
  }
}

export {};

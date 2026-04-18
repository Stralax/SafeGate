// Minimal type shim for WebGazer.js 3.x — the package ships no types.
declare module "webgazer" {
  export interface WebGazerGazeData {
    x: number;
    y: number;
  }

  export type WebGazerRegression = "ridge" | "weightedRidge" | "threadedRidge";

  export interface WebGazerInstance {
    begin(): Promise<WebGazerInstance>;
    end(): Promise<void>;
    isReady(): boolean;
    setGazeListener(
      listener: (data: WebGazerGazeData | null, timestamp: number) => void,
    ): WebGazerInstance;
    clearGazeListener(): WebGazerInstance;
    setRegression(type: WebGazerRegression): WebGazerInstance;
    showVideo(show: boolean): WebGazerInstance;
    showVideoPreview(show: boolean): WebGazerInstance;
    showPredictionPoints(show: boolean): WebGazerInstance;
    showFaceOverlay(show: boolean): WebGazerInstance;
    showFaceFeedbackBox(show: boolean): WebGazerInstance;
    saveDataAcrossSessions(save: boolean): WebGazerInstance;
    recordScreenPosition(x: number, y: number, eventType?: string): void;
    params: {
      showVideo: boolean;
      saveDataAcrossSessions: boolean;
      /** Path WebGazer uses to load MediaPipe FaceMesh assets (default: './mediapipe/face_mesh') */
      faceMeshSolutionPath: string;
      [key: string]: unknown;
    };
  }

  const webgazer: WebGazerInstance;
  export default webgazer;
}

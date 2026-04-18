"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WebEyeTrackStatus = "idle" | "loading" | "ready" | "error";

export interface GazePoint {
  x: number;
  y: number;
}

export interface UseWebEyeTrackReturn {
  status: WebEyeTrackStatus;
  error: Error | null;
  /** Latest gaze in client pixels (throttled to ~30 Hz), null until first valid sample */
  gaze: GazePoint | null;
  /** True when the underlying model has detected a face in the last frame */
  faceDetected: boolean;
  init: () => Promise<void>;
  teardown: () => Promise<void>;
  /**
   * Calibration is handled automatically by `WebEyeTrackProxy` via a
   * global `window` click listener — this method is kept for API parity
   * with `useWebGazer` so the ocular page doesn't need to branch.
   */
  recordCalibrationClick: (x: number, y: number) => void;
}

const GAZE_THROTTLE_MS = 33; // ~30 Hz — matches backend MIN_SAMPLE_HZ guardrail
// EMA smoothing — BlazeGaze output is much cleaner than WebGazer but still
// jitters a few px at the pupil level; α = 0.35 keeps the dot responsive.
const SMOOTH_ALPHA = 0.35;
const VIDEO_ELEMENT_ID = "webeyetrack-video";

/**
 * React hook wrapping WebEyeTrack's `WebEyeTrackProxy`. Dynamic-imports the
 * library so Next.js never SSRs it, creates a hidden <video> element for the
 * `WebcamClient`, and converts the model's normalized PoG ([-0.5, 0.5]) into
 * client pixel coordinates.
 *
 * Privacy: camera frames stay entirely in-browser — the proxy ships them to
 * a Web Worker via postMessage, never to a network endpoint.
 */
export function useWebEyeTrack(): UseWebEyeTrackReturn {
  const [status, setStatus] = useState<WebEyeTrackStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [gaze, setGaze] = useState<GazePoint | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // `proxyRef` and `webcamRef` hold opaque library objects; typed as unknown
  // to avoid forcing a synchronous import of `webeyetrack` (which pulls in
  // @tensorflow/tfjs and would break SSR).
  const proxyRef = useRef<unknown>(null);
  const webcamRef = useRef<{ stopWebcam: () => void } | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef(0);
  const smoothRef = useRef<GazePoint | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Release camera + detach video element immediately so the browser
      // indicator clears even if teardown() wasn't called explicitly.
      webcamRef.current?.stopWebcam();
      webcamRef.current = null;
      proxyRef.current = null;
      if (videoElRef.current?.parentNode) {
        videoElRef.current.parentNode.removeChild(videoElRef.current);
      }
      videoElRef.current = null;
    };
  }, []);

  const init = useCallback(async () => {
    if (proxyRef.current) return;
    setStatus("loading");
    setError(null);

    try {
      const { WebcamClient, WebEyeTrackProxy } = await import("webeyetrack");

      // `WebcamClient` requires a pre-existing <video> element in the DOM.
      // Insert a hidden one so callers don't have to render it themselves.
      let video = document.getElementById(VIDEO_ELEMENT_ID) as HTMLVideoElement | null;
      if (!video) {
        video = document.createElement("video");
        video.id = VIDEO_ELEMENT_ID;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.display = "none";
        document.body.appendChild(video);
      }
      videoElRef.current = video;

      const webcamClient = new WebcamClient(VIDEO_ELEMENT_ID);
      webcamRef.current = webcamClient as unknown as { stopWebcam: () => void };

      const proxy = new WebEyeTrackProxy(webcamClient);
      proxyRef.current = proxy;

      proxy.onGazeResults = (gazeResult) => {
        if (!mountedRef.current) return;

        const detected = Array.isArray(gazeResult.facialLandmarks) && gazeResult.facialLandmarks.length > 0;
        setFaceDetected(detected);

        // No gaze when eyes closed or face missing — don't update the dot.
        if (!detected || gazeResult.gazeState === "closed") return;

        const [nx, ny] = gazeResult.normPog;
        const rawX = (nx + 0.5) * window.innerWidth;
        const rawY = (ny + 0.5) * window.innerHeight;

        const prev = smoothRef.current;
        const next: GazePoint = prev
          ? {
              x: prev.x + SMOOTH_ALPHA * (rawX - prev.x),
              y: prev.y + SMOOTH_ALPHA * (rawY - prev.y),
            }
          : { x: rawX, y: rawY };
        smoothRef.current = next;

        // Throttle React state updates to ~30 Hz to keep sampler cadence
        // aligned with backend expectations and avoid re-render thrash.
        const now = performance.now();
        if (now - lastUpdateRef.current < GAZE_THROTTLE_MS) return;
        lastUpdateRef.current = now;

        if (status !== "ready" && mountedRef.current) setStatus("ready");
        setGaze(next);
      };

      // Flip to "ready" optimistically once the proxy is wired — the webcam
      // starts asynchronously after the worker posts its "ready" message.
      if (mountedRef.current) setStatus("ready");
    } catch (err) {
      const e = err instanceof Error ? err : new Error("WebEyeTrack failed to initialize");
      if (mountedRef.current) {
        setError(e);
        setStatus("error");
      }
      throw e;
    }
  }, [status]);

  const teardown = useCallback(async () => {
    webcamRef.current?.stopWebcam();
    webcamRef.current = null;
    proxyRef.current = null;
    if (videoElRef.current?.parentNode) {
      videoElRef.current.parentNode.removeChild(videoElRef.current);
    }
    videoElRef.current = null;
    smoothRef.current = null;
    if (mountedRef.current) {
      setStatus("idle");
      setGaze(null);
      setFaceDetected(false);
    }
  }, []);

  // Calibration is auto-handled by the proxy's internal window-click listener.
  // This is a no-op kept only so callers can share code with the WebGazer hook.
  const recordCalibrationClick = useCallback((_x: number, _y: number) => {
    void _x;
    void _y;
  }, []);

  return {
    status,
    error,
    gaze,
    faceDetected,
    init,
    teardown,
    recordCalibrationClick,
  };
}

"use client";

import { motion } from "framer-motion";
import { Camera, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WebGazerPermissionProps {
  loading: boolean;
  error: Error | null;
  onEnable: () => void;
  onSkip: () => void;
}

export function WebGazerPermission({
  loading,
  error,
  onEnable,
  onSkip,
}: WebGazerPermissionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 text-center"
    >
      <div className="rounded-full bg-safegate-surface p-5 text-safegate-primary shadow-glow">
        <Camera className="h-12 w-12" strokeWidth={1.6} />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-50">
          Camera Access Required
        </h2>
        <p className="text-slate-400 font-medium">
          Ocular Pursuit is our most precise sobriety signal. We track your
          eye movement while you follow a moving dot for 10 seconds.
        </p>
      </div>

      <ul className="w-full space-y-3 rounded-xl border border-slate-800 bg-safegate-surface/60 p-5 text-left text-sm">
        <li className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-safegate-primary" />
          <span className="text-slate-300">
            <strong className="text-slate-50">Your webcam never leaves this device.</strong>{" "}
            Video is processed entirely in your browser.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-safegate-success" />
          <span className="text-slate-300">
            Only <strong className="text-slate-50">numeric gaze coordinates</strong> are sent
            to SafeGate — no video frames, no face images.
          </span>
        </li>
      </ul>

      <div className="flex w-full flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onEnable}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Initializing camera…" : "Enable Camera"}
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={loading}>
          Skip — use Decision Speed instead
        </Button>
      </div>

      {error && (
        <motion.p
          initial={{ x: -8 }}
          animate={{ x: [0, -8, 8, -8, 8, 0] }}
          transition={{ duration: 0.4 }}
          className="w-full rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-sm text-safegate-danger"
        >
          {error.message.includes("Permission") || error.message.includes("denied")
            ? "Camera access denied. You can still proceed with the Decision Speed test."
            : error.message}
        </motion.p>
      )}
    </motion.section>
  );
}

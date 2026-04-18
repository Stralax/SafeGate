"use client";

import { motion } from "framer-motion";
import { Car, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FinalResult = "APPROVED" | "DENIED";

export default function ResultPage() {
  const router = useRouter();
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  useEffect(() => {
    const result = window.localStorage.getItem("safegate:session_result") as FinalResult | null;
    if (!result) {
      router.replace("/");
      return;
    }
    setFinalResult(result);
  }, [router]);

  const handleRetry = () => {
    window.localStorage.removeItem("safegate:session_result");
    window.localStorage.removeItem("safegate:session_score");
    window.localStorage.removeItem("safegate:game1_outcome");
    window.localStorage.removeItem("safegate:game_number");
    router.push("/");
  };

  if (!finalResult) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
      </div>
    );
  }

  const approved = finalResult === "APPROVED";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "mx-auto flex w-full max-w-md flex-col items-center gap-8 rounded-xl border border-slate-800 bg-gradient-to-br p-8 text-center",
          approved
            ? "from-safegate-success/25 via-safegate-surface to-safegate-bg shadow-glow-success"
            : "from-safegate-danger/25 via-safegate-surface to-safegate-bg shadow-glow-danger",
        )}
      >
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
          className={cn(
            "rounded-full bg-safegate-bg p-5",
            approved ? "text-safegate-success" : "text-safegate-danger",
          )}
        >
          {approved ? (
            <ShieldCheck className="h-12 w-12" strokeWidth={1.8} />
          ) : (
            <ShieldX className="h-12 w-12" strokeWidth={1.8} />
          )}
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50">
            {approved ? "Vehicle Unlocked" : "Access Denied"}
          </h2>
          <p className="font-medium text-slate-400">
            {approved
              ? "You passed both checks. Safe travels."
              : "We've got a safer option ready for you."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {approved ? (
            <Button variant="success" size="lg" onClick={() => alert("🚗  Vehicle unlocked (demo)")}>
              <Car className="h-5 w-5" /> Unlock Vehicle
            </Button>
          ) : (
            <Button variant="danger" size="lg" onClick={() => alert("🚕  Taxi requested (demo)")}>
              <Car className="h-5 w-5" /> Call Taxi
            </Button>
          )}
          <Button variant="ghost" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </motion.section>
    </div>
  );
}

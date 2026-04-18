"use client";

import { useRouter } from 'next/navigation';
import { BalansIndikator } from '@/components/game/balans-indikator/balans-indikator';
import { completeGame } from '@/lib/game-flow';

export default function BalansIndikatorPage() {
  const router = useRouter();
  return (
    <BalansIndikator
      onComplete={(score) => completeGame(score, '/balans-indikator', router)}
    />
  );
}
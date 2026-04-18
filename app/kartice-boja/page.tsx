"use client";

import { useRouter } from 'next/navigation';
import { KarticeBoja } from '@/components/game/kartice-boja/kartice-boja';
import { completeGame } from '@/lib/game-flow';

export default function KarticeBojaPage() {
  const router = useRouter();
  return (
    <KarticeBoja
      onComplete={(score) => completeGame(score, '/kartice-boja', router)}
    />
  );
}
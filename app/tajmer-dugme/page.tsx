"use client";

import { useRouter } from 'next/navigation';
import { TajmerDugme } from '@/components/game/tajmer-dugme/tajmer-dugme';
import { completeGame } from '@/lib/game-flow';

export default function TajmerDugmePage() {
  const router = useRouter();
  return (
    <TajmerDugme
      onComplete={(score) => completeGame(score, '/tajmer-dugme', router)}
    />
  );
}
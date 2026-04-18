"use client";

import { useRouter } from 'next/navigation';
import { PisanjeUnazad } from '@/components/game/pisanje-unazad/pisanje-unazad';
import { completeGame } from '@/lib/game-flow';

export default function PisanjeUnazadPage() {
  const router = useRouter();
  return (
    <PisanjeUnazad
      onComplete={(score) => completeGame(score, '/pisanje-unazad', router)}
    />
  );
}

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConfettiBackgroundProps {
  children: React.ReactNode;
}

const confettiColors = ['#ff69b4', '#ffd700', '#87ceeb', '#98fb98', '#dda0dd', '#f0e68c', '#ff6b6b', '#4ecdc4'];

export function ConfettiBackground({ children }: ConfettiBackgroundProps) {
  // Gerar partículas com posições e delays aleatórios (memoizado para evitar re-renders)
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 2,
      color: confettiColors[i % confettiColors.length],
      size: 3 + Math.random() * 4,
      rotation: Math.random() * 360,
    })), []
  );

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Partículas de confetti */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ top: '-10%', opacity: 0, rotate: 0 }}
          animate={{
            top: ['0%', '110%'],
            opacity: [0, 1, 1, 0],
            rotate: [0, p.rotation],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

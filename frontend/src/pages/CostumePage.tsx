import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCostumeMe, useBallsView } from '../hooks/useCostume';
import { useGuests } from '../hooks/useGuests';
import { getGuestId, isAdmin } from '../lib/identity';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { Guest } from '../lib/types';

type Phase = 'idle' | 'sorting' | 'paired' | 'revealed';

const FORCED_PAIR_NAMES: [string, string][] = [
  ['Paula', 'Vigara'],
  ['Tota', 'Elsa'],
];

function findGuestByPartialName(guests: Guest[], partial: string): Guest | undefined {
  const lower = partial.toLowerCase();
  return guests.find(g => g.fullName.toLowerCase().includes(lower));
}

export default function CostumePage() {
  const guestId = getGuestId();
  const { data: costume, isError: meError } = useCostumeMe();
  const { data: ballsView, isError: ballsError } = useBallsView();
  const { data: allGuests } = useGuests();
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawRunning, setDrawRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDrawConfig, setShowDrawConfig] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const isDrawDone = !!costume && !!ballsView;
  const noDrawYet = meError || ballsError;

  const registeredGuests = useMemo(() => {
    if (!allGuests) return [];
    return allGuests.filter(g => g.isRegistered).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [allGuests]);

  // Flatten all balls from pairs
  const allBalls = useMemo(() => {
    if (!ballsView) return [];
    const balls: { color: string; pairIndex: number }[] = [];
    ballsView.pairs.forEach((pair, pi) => {
      pair.ballColors.forEach(c => balls.push({ color: c, pairIndex: pi }));
    });
    return balls;
  }, [ballsView]);

  const myBallColor = ballsView?.myBallColor ?? '';

  // Generate stable random initial positions for each ball
  const ballPositions = useMemo(() => {
    if (allBalls.length === 0) return [];
    const seed = allBalls.map(b => b.color).join('');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return allBalls.map((_, i) => {
      const h = ((hash * (i + 1) * 31) >>> 0) % 10000;
      return {
        x: (h % 100) / 100,
        y: ((h / 100) % 100) / 100,
      };
    });
  }, [allBalls]);

  // Paired positions: group balls by pairIndex
  const pairedPositions = useMemo(() => {
    if (allBalls.length === 0) return [];
    const pairCount = ballsView?.pairs.length ?? 0;
    const cols = Math.ceil(Math.sqrt(pairCount));
    const positions: { x: number; y: number }[] = [];

    allBalls.forEach(ball => {
      const row = Math.floor(ball.pairIndex / cols);
      const col = ball.pairIndex % cols;
      const siblingsInPair = allBalls.filter(b => b.pairIndex === ball.pairIndex);
      const indexInPair = siblingsInPair.findIndex(b => b.color === ball.color);
      const pairSize = siblingsInPair.length;

      const cellX = (col + 0.5) / cols;
      const cellY = (row + 0.5) / Math.ceil(pairCount / cols);
      const offset = pairSize === 1 ? 0 : (indexInPair - (pairSize - 1) / 2) * 0.04;

      positions.push({ x: Math.max(0.05, Math.min(0.95, cellX + offset)), y: Math.max(0.05, Math.min(0.95, cellY)) });
    });

    return positions;
  }, [allBalls, ballsView]);

  const handleSort = useCallback(() => {
    setPhase('sorting');
    setTimeout(() => setPhase('paired'), 3000);
  }, []);

  const handleReveal = useCallback(() => {
    setPhase('revealed');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const toggleExclude = useCallback((id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRunDraw = useCallback(async () => {
    setDrawRunning(true);
    try {
      // Build forced pairs from guest names
      const forcedPairs: { guestId1: string; guestId2: string }[] = [];
      if (registeredGuests.length > 0) {
        for (const [name1, name2] of FORCED_PAIR_NAMES) {
          const g1 = findGuestByPartialName(registeredGuests, name1);
          const g2 = findGuestByPartialName(registeredGuests, name2);
          if (g1 && g2 && !excludedIds.has(g1.id) && !excludedIds.has(g2.id)) {
            forcedPairs.push({ guestId1: g1.id, guestId2: g2.id });
          }
        }
      }

      await api.post('/api/admin/costume/draw', {
        excludeGuestIds: Array.from(excludedIds),
        forcedPairs,
      });
      void queryClient.invalidateQueries({ queryKey: ['costume'] });
      setPhase('idle');
      setShowDrawConfig(false);
    } finally {
      setDrawRunning(false);
    }
  }, [excludedIds, registeredGuests]);

  if (!guestId) return null;

  // Admin draw config modal
  const drawConfigModal = showDrawConfig && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={() => setShowDrawConfig(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-100 border border-glass-border rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-base font-bold text-white">Configurar sorteo</h3>
          <p className="text-xs text-slate-400 mt-1">Desmarca a quienes no participan</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {registeredGuests.map(g => {
            const isExcluded = excludedIds.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleExclude(g.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isExcluded
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-surface-50/50 border border-glass-border hover:bg-surface-200/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isExcluded ? 'border-red-500 bg-red-500/20' : 'border-brand-400 bg-brand-400'
                }`}>
                  {!isExcluded && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${isExcluded ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {g.fullName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Forced pairs info */}
        <div className="px-4 py-2 border-t border-glass-border">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Parejas forzadas</p>
          {FORCED_PAIR_NAMES.map(([n1, n2], i) => {
            const g1 = findGuestByPartialName(registeredGuests, n1);
            const g2 = findGuestByPartialName(registeredGuests, n2);
            const active = g1 && g2 && !excludedIds.has(g1.id) && !excludedIds.has(g2.id);
            return (
              <p key={i} className={`text-xs ${active ? 'text-brand-300' : 'text-slate-600 line-through'}`}>
                {g1?.fullName ?? n1} + {g2?.fullName ?? n2}
              </p>
            );
          })}
        </div>

        <div className="p-4 border-t border-glass-border flex gap-2">
          <button
            onClick={() => setShowDrawConfig(false)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-200 text-slate-400 hover:bg-surface-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleRunDraw()}
            disabled={drawRunning || registeredGuests.length - excludedIds.size < 2}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {drawRunning ? 'Sorteando...' : `Sortear (${registeredGuests.length - excludedIds.size})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  // Draw not done yet
  if (noDrawYet && !isDrawDone) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <AnimatePresence>{drawConfigModal}</AnimatePresence>

        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 mb-6 rounded-full bg-surface-200 flex items-center justify-center"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Sorteo pendiente</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          El sorteo de disfraces aún no se ha realizado. Espera a que un administrador lo lance.
        </p>
        {isAdmin() && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDrawConfig(true)}
            className="mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            Configurar y lanzar sorteo
          </motion.button>
        )}
      </motion.div>
    );
  }

  if (!isDrawDone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-surface-200"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center px-2"
    >
      <AnimatePresence>{drawConfigModal}</AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[200]">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
                  rotate: Math.random() * 720 - 360,
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: Math.random() * 2 + 1.5, ease: 'easeIn', delay: Math.random() * 0.5 }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#ef4444','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6'][i % 6],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* My ball indicator */}
      <div className="flex items-center gap-3 mb-4 bg-surface-100 border border-glass-border rounded-xl px-4 py-3 w-full max-w-sm">
        <div
          className="w-8 h-8 rounded-full shrink-0 shadow-lg"
          style={{ backgroundColor: myBallColor, boxShadow: `0 0 12px ${myBallColor}40` }}
        />
        <div>
          <p className="text-xs text-slate-400">Tu bola</p>
          <p className="text-sm font-bold text-white">Encuéntrala abajo</p>
        </div>
      </div>

      {/* Ball arena */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm aspect-square bg-surface-0/50 border-2 border-glass-border rounded-2xl overflow-hidden"
      >
        {/* Background grid dots */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {allBalls.map((ball, i) => {
          const isMyBall = ball.color === myBallColor;
          const initPos = ballPositions[i] ?? { x: 0.5, y: 0.5 };
          const pairedPos = pairedPositions[i] ?? initPos;

          const targetX = `${pairedPos.x * 85 + 5}%`;
          const targetY = `${pairedPos.y * 85 + 5}%`;

          return (
            <motion.div
              key={ball.color}
              initial={{
                left: `${initPos.x * 85 + 5}%`,
                top: `${initPos.y * 85 + 5}%`,
                scale: 0,
              }}
              animate={
                phase === 'idle'
                  ? {
                      left: `${initPos.x * 85 + 5}%`,
                      top: `${initPos.y * 85 + 5}%`,
                      scale: 1,
                      y: [0, -6, 0],
                    }
                  : phase === 'sorting'
                    ? {
                        left: [
                          `${initPos.x * 85 + 5}%`,
                          `${((initPos.x + pairedPos.x) / 2 + (Math.random() - 0.5) * 0.3) * 85 + 5}%`,
                          targetX,
                        ],
                        top: [
                          `${initPos.y * 85 + 5}%`,
                          `${((initPos.y + pairedPos.y) / 2 + (Math.random() - 0.5) * 0.3) * 85 + 5}%`,
                          targetY,
                        ],
                        scale: 1,
                      }
                    : {
                        left: targetX,
                        top: targetY,
                        scale: 1,
                      }
              }
              transition={
                phase === 'idle'
                  ? { scale: { type: 'spring', delay: i * 0.03 }, y: { duration: 2 + i * 0.1, repeat: Infinity, ease: 'easeInOut' } }
                  : phase === 'sorting'
                    ? { duration: 2.5, ease: 'easeInOut', delay: i * 0.02 }
                    : { duration: 0.5, ease: 'easeOut' }
              }
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: isMyBall ? 20 : 10 }}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-shadow ${
                  isMyBall ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                }`}
                style={{
                  backgroundColor: ball.color,
                  boxShadow: isMyBall ? `0 0 20px ${ball.color}80` : `0 0 8px ${ball.color}30`,
                }}
              >
                {isMyBall && (
                  <span className="text-white text-[10px] font-black drop-shadow-lg">TU</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Pair connection lines when paired */}
        {(phase === 'paired' || phase === 'revealed') && ballsView?.pairs.map((_pair, pi) => {
          const pairBalls = allBalls
            .map((b, i) => ({ ...b, i }))
            .filter(b => b.pairIndex === pi);
          if (pairBalls.length < 2) return null;

          return pairBalls.slice(1).map((b, j) => {
            const a = pairBalls[0];
            const posA = pairedPositions[a.i];
            const posB = pairedPositions[b.i];
            if (!posA || !posB) return null;

            return (
              <motion.div
                key={`line-${pi}-${j}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 0.3 }}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              >
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <line
                    x1={`${posA.x * 85 + 5}%`}
                    y1={`${posA.y * 85 + 5}%`}
                    x2={`${posB.x * 85 + 5}%`}
                    y2={`${posB.y * 85 + 5}%`}
                    stroke="white"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>
              </motion.div>
            );
          });
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 text-center space-y-3 w-full max-w-sm">
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-slate-400 mb-3">
              {allBalls.length} bolas listas. Pulsa para iniciar el sorteo.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSort}
              className="w-full px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-purple to-accent-pink shadow-lg shadow-accent-purple/20 hover:opacity-90 transition-all cursor-pointer text-lg"
            >
              Sortear
            </motion.button>
          </motion.div>
        )}

        {phase === 'sorting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-bold text-white"
            >
              Emparejando bolas...
            </motion.div>
            <p className="text-xs text-slate-500">Las bolas se están juntando de dos en dos</p>
          </motion.div>
        )}

        {phase === 'paired' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-sm text-slate-400">
              Tu bola ya tiene pareja. Descubre quién es.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReveal}
              className="w-full px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-500 to-brand-400 shadow-lg shadow-brand-500/20 hover:opacity-90 transition-all cursor-pointer text-lg"
            >
              Revelar pareja
            </motion.button>
          </motion.div>
        )}

        {phase === 'revealed' && costume && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-surface-100 border border-glass-border rounded-2xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tu pareja de disfraz</p>
              <div className="flex flex-wrap justify-center gap-2">
                {costume.partners.map(name => (
                  <motion.span
                    key={name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-base bg-surface-200 text-white px-4 py-2 rounded-full border border-glass-border font-semibold"
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Temática: <span className="font-semibold text-slate-300">Heroes y villanos</span>
              </p>
            </div>

            <button
              onClick={() => setPhase('idle')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Ver animación de nuevo
            </button>
          </motion.div>
        )}
      </div>

      {/* Admin: re-draw */}
      {isAdmin() && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDrawConfig(true)}
          disabled={drawRunning}
          className="mt-8 px-4 py-2 rounded-lg text-xs font-medium bg-surface-200 text-slate-400 hover:bg-surface-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          Re-lanzar sorteo (admin)
        </motion.button>
      )}
    </motion.div>
  );
}

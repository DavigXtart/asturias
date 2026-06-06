import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCostumeMe } from '../hooks/useCostume';
import { getGuestId, isAdmin } from '../lib/identity';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';

// Color mapping for ball colors
const BALL_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  ROJO:     { bg: 'bg-red-500',    glow: 'shadow-red-500/50',    text: 'Rojo' },
  AZUL:     { bg: 'bg-blue-500',   glow: 'shadow-blue-500/50',   text: 'Azul' },
  VERDE:    { bg: 'bg-green-500',  glow: 'shadow-green-500/50',  text: 'Verde' },
  AMARILLO: { bg: 'bg-yellow-400', glow: 'shadow-yellow-400/50', text: 'Amarillo' },
  NARANJA:  { bg: 'bg-orange-500', glow: 'shadow-orange-500/50', text: 'Naranja' },
  MORADO:   { bg: 'bg-purple-500', glow: 'shadow-purple-500/50', text: 'Morado' },
  ROSA:     { bg: 'bg-pink-500',   glow: 'shadow-pink-500/50',   text: 'Rosa' },
  CYAN:     { bg: 'bg-cyan-400',   glow: 'shadow-cyan-400/50',   text: 'Cian' },
  BLANCO:   { bg: 'bg-white',      glow: 'shadow-white/50',      text: 'Blanco' },
  NEGRO:    { bg: 'bg-gray-800',   glow: 'shadow-gray-800/50',   text: 'Negro' },
};

function getBallStyle(color: string) {
  return BALL_COLORS[color.toUpperCase()] ?? { bg: 'bg-brand-500', glow: 'shadow-brand-500/50', text: color };
}

export default function CostumePage() {
  const guestId = getGuestId();
  const { data: costume, isLoading, isError } = useCostumeMe();
  const [revealed, setRevealed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [drawRunning, setDrawRunning] = useState(false);

  const handleReveal = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setRevealed(true);
      setAnimating(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 2000);
  }, []);

  const handleRunDraw = useCallback(async () => {
    setDrawRunning(true);
    try {
      await api.post('/api/admin/costume/draw');
      void queryClient.invalidateQueries({ queryKey: ['costume'] });
    } finally {
      setDrawRunning(false);
    }
  }, []);

  if (!guestId) return null;

  // Draw not done yet
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
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
            onClick={() => void handleRunDraw()}
            disabled={drawRunning}
            className="mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {drawRunning ? 'Sorteando...' : 'Lanzar sorteo'}
          </motion.button>
        )}
      </motion.div>
    );
  }

  if (isLoading || !costume) {
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

  const ballStyle = getBallStyle(costume.ballColor);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[200]">
            {Array.from({ length: 40 }).map((_, i) => (
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
                  backgroundColor: ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6'][i % 6],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Ball animation area */}
      <div className="relative w-64 h-64 mb-8">
        {!revealed && !animating && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, y: [0, -8, 0] }}
            transition={{
              scale: { type: 'spring', stiffness: 260, damping: 20 },
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className={`absolute inset-0 m-auto w-32 h-32 rounded-full ${ballStyle.bg} shadow-2xl ${ballStyle.glow} flex items-center justify-center`}
          >
            <span className="text-4xl font-black text-white/80">?</span>
          </motion.div>
        )}

        {animating && (
          <>
            {/* Multiple balls swirling */}
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  scale: 0.3,
                  opacity: 0.6,
                }}
                animate={{
                  x: [Math.random() * 150 - 75, 0],
                  y: [Math.random() * 150 - 75, 0],
                  scale: [0.3, i === 0 ? 1 : 0],
                  opacity: [0.8, i === 0 ? 1 : 0],
                }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full shadow-xl ${
                  i === 0 ? ballStyle.bg : ['bg-red-400','bg-blue-400','bg-green-400','bg-yellow-400'][i - 1]
                }`}
              />
            ))}
          </>
        )}

        {revealed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`absolute inset-0 m-auto w-36 h-36 rounded-full ${ballStyle.bg} shadow-2xl ${ballStyle.glow} flex items-center justify-center`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Info */}
      {!revealed ? (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Tu bola de disfraz</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Pulsa el botón para revelar tu color y compañeros de disfraz
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReveal}
            disabled={animating}
            className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent-purple to-accent-pink shadow-lg shadow-accent-purple/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 text-lg"
          >
            {animating ? 'Revelando...' : 'Revelar'}
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4"
        >
          <h2 className="text-2xl font-bold text-white">
            Bola <span className={`${ballStyle.bg === 'bg-white' ? 'text-slate-300' : ''}`}>{ballStyle.text}</span>
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Tus compañeros de disfraz:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {costume.partners.map(name => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm bg-surface-100 text-white px-3 py-1.5 rounded-full border border-glass-border font-medium"
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Admin: re-draw */}
      {isAdmin() && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleRunDraw()}
          disabled={drawRunning}
          className="mt-8 px-4 py-2 rounded-lg text-xs font-medium bg-surface-200 text-slate-400 hover:bg-surface-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {drawRunning ? 'Sorteando...' : 'Re-lanzar sorteo (admin)'}
        </motion.button>
      )}
    </motion.div>
  );
}

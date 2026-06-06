import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuests } from '../hooks/useGuests';
import { setGuestId } from '../lib/identity';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import type { Guest } from '../lib/types';

interface NamePickerProps {
  onPicked: (guest: Guest) => void;
}

export default function NamePicker({ onPicked }: NamePickerProps) {
  const { data: guests, isLoading, isError, refetch } = useGuests();
  const [search, setSearch] = useState('');

  if (isLoading) return <PageSkeleton />;
  if (isError || !guests) return <ErrorMessage message="No se pudieron cargar los invitados" onRetry={() => void refetch()} />;

  const filtered = guests.filter(g =>
    g.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (guest: Guest) => {
    setGuestId(guest.id);
    onPicked(guest);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start bg-surface-0 px-4 pt-16 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Asturias 2026</h1>
          <p className="text-sm text-slate-400 text-center">
            10 — 17 Julio &middot; Casa Rural
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white text-center">
            ¿Quién eres?
          </h2>
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-100 border border-glass-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
              aria-label="Buscar nombre"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filtered.map((guest, i) => (
              <motion.button
                key={guest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleSelect(guest)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-100 hover:bg-surface-200 border border-glass-border hover:border-brand-500/30 transition-all cursor-pointer group text-left"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  guest.isRegistered
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-brand-500/20 text-brand-400'
                }`}>
                  {guest.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                    {guest.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {guest.isRegistered ? 'Registrado' : 'Sin registrar'}
                  </p>
                </div>
                {!guest.isRegistered && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-amber/10 text-accent-amber px-2 py-0.5 rounded-full whitespace-nowrap">
                    Pendiente
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-brand-400 transition-colors shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.button>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-6">
              No se encontró ningún nombre
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

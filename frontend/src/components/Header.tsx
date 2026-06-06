import { motion } from 'framer-motion';
import { getGuestId, isAdmin, clearGuestId, clearAdminPin } from '../lib/identity';
import { useGuests } from '../hooks/useGuests';

interface HeaderProps {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: HeaderProps) {
  const { data: guests } = useGuests();
  const guestId = getGuestId();
  const currentGuest = guests?.find(g => g.id === guestId);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-surface-50/80 backdrop-blur-xl border-b border-glass-border"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
          Asturias 2026
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {currentGuest && (
          <span className="text-sm text-slate-400 hidden sm:block">
            {currentGuest.fullName}
          </span>
        )}
        {isAdmin() && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
        <button
          onClick={onAdminClick}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-glass-hover transition-colors cursor-pointer"
          aria-label="Panel de administración"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        {guestId && (
          <button
            onClick={() => { clearGuestId(); clearAdminPin(); window.location.reload(); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-glass-hover transition-colors cursor-pointer"
            aria-label="Cerrar sesión"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </motion.header>
  );
}

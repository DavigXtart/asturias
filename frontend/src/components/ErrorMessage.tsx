import { motion } from 'framer-motion';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'Ha ocurrido un error', onRetry }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-accent-red/10 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-red">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="text-slate-300 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </motion.div>
  );
}

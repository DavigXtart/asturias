import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCities } from '../hooks/useCities';
import { useConfig } from '../hooks/useConfig';
import { useRegisterGuest } from '../hooks/useGuests';
import { getDateRange, formatDateShort, formatDayOfWeek } from '../lib/dates';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import type { Guest } from '../lib/types';

interface RegisterFormProps {
  guest: Guest;
  onDone: () => void;
}

export default function RegisterForm({ guest, onDone }: RegisterFormProps) {
  const { data: cities, isLoading: loadingCities } = useCities();
  const { data: config, isLoading: loadingConfig } = useConfig();
  const registerMutation = useRegisterGuest();

  const [cityId, setCityId] = useState<number | undefined>(guest.cityId ?? undefined);
  const [cityOther, setCityOther] = useState(guest.cityOther ?? '');
  const [showOther, setShowOther] = useState(!!guest.cityOther);
  const [arrivalDate, setArrivalDate] = useState(guest.arrivalDate ?? '');
  const [departureDate, setDepartureDate] = useState(guest.departureDate ?? '');
  const [canDrive, setCanDrive] = useState(guest.canDrive);

  const dates = config ? getDateRange(config.tripStart, config.tripEnd) : [];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalDate || !departureDate) return;
    await registerMutation.mutateAsync({
      id: guest.id,
      data: {
        cityId: showOther ? undefined : cityId,
        cityOther: showOther ? cityOther : undefined,
        arrivalDate,
        departureDate,
        canDrive,
      },
    });
    onDone();
  }, [arrivalDate, departureDate, cityId, cityOther, showOther, canDrive, guest.id, registerMutation, onDone]);

  if (loadingCities || loadingConfig) return <PageSkeleton />;
  if (!cities || !config) return <ErrorMessage message="Error cargando datos" />;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start bg-surface-0 px-4 pt-16 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-brand-500/30"
          >
            {guest.fullName.charAt(0)}
          </motion.div>
          <h1 className="text-xl font-bold text-white mt-3">{guest.fullName}</h1>
          <p className="text-sm text-slate-400">Completa tu registro</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Ciudad de salida</label>
            {!showOther ? (
              <div className="space-y-2">
                <select
                  value={cityId ?? ''}
                  onChange={e => setCityId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 bg-surface-100 border border-glass-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                  aria-label="Ciudad de salida"
                >
                  <option value="">Seleccionar ciudad...</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowOther(true); setCityId(undefined); }}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                >
                  Mi ciudad no aparece
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cityOther}
                  onChange={e => setCityOther(e.target.value)}
                  placeholder="Escribe tu ciudad..."
                  className="w-full px-4 py-3 bg-surface-100 border border-glass-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Otra ciudad"
                />
                <button
                  type="button"
                  onClick={() => { setShowOther(false); setCityOther(''); }}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                >
                  Elegir de la lista
                </button>
              </div>
            )}
          </div>

          {/* Arrival */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Fecha de llegada</label>
            <div className="grid grid-cols-4 gap-2">
              {dates.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setArrivalDate(d)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    arrivalDate === d
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                      : 'bg-surface-100 border-glass-border text-slate-400 hover:border-surface-300'
                  }`}
                >
                  <span className="text-[10px] uppercase">{formatDayOfWeek(d)}</span>
                  <span className="font-semibold">{formatDateShort(d)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Departure */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Fecha de salida</label>
            <div className="grid grid-cols-4 gap-2">
              {dates.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepartureDate(d)}
                  disabled={!!arrivalDate && d < arrivalDate}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    departureDate === d
                      ? 'bg-accent-green/20 border-accent-green text-accent-green'
                      : d < arrivalDate && arrivalDate
                        ? 'bg-surface-100/50 border-glass-border text-slate-600 cursor-not-allowed'
                        : 'bg-surface-100 border-glass-border text-slate-400 hover:border-surface-300'
                  }`}
                >
                  <span className="text-[10px] uppercase">{formatDayOfWeek(d)}</span>
                  <span className="font-semibold">{formatDateShort(d)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Can drive */}
          <div className="flex items-center justify-between p-4 bg-surface-100 rounded-xl border border-glass-border">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-white">¿Puedes llevar coche?</p>
              <p className="text-xs text-slate-500">Indica si puedes conducir</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={canDrive}
              aria-label="¿Puedes llevar coche?"
              onClick={() => setCanDrive(!canDrive)}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
                canDrive ? 'bg-accent-green' : 'bg-surface-300'
              }`}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                animate={{ left: canDrive ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={!arrivalDate || !departureDate || registerMutation.isPending}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-brand-500/20"
          >
            {registerMutation.isPending ? 'Guardando...' : 'Confirmar asistencia'}
          </motion.button>

          {registerMutation.isError && (
            <p className="text-xs text-accent-red text-center">
              Error al guardar. Inténtalo de nuevo.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}

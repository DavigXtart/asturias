import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGuests } from '../hooks/useGuests';
import { useConfig } from '../hooks/useConfig';
import { getDateRange, formatDateShort, formatDayOfWeek } from '../lib/dates';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';

export default function AttendancePage() {
  const { data: guests, isLoading: loadingGuests, isError, refetch } = useGuests();
  const { data: config, isLoading: loadingConfig } = useConfig();

  const dates = useMemo(() => {
    if (!config) return [];
    return getDateRange(config.tripStart, config.tripEnd);
  }, [config]);

  const registered = useMemo(() => {
    if (!guests) return [];
    return guests.filter(g => g.isRegistered).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [guests]);

  const totalByDay = useMemo(() => {
    return dates.map(d => {
      const count = registered.filter(g =>
        g.arrivalDate && g.departureDate &&
        d >= g.arrivalDate && d <= g.departureDate
      ).length;
      return { date: d, count };
    });
  }, [dates, registered]);

  if (loadingGuests || loadingConfig) return <PageSkeleton />;
  if (isError) return <ErrorMessage message="Error cargando invitados" onRetry={() => void refetch()} />;

  const totalGuests = guests?.length ?? 0;
  const registeredCount = registered.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-100 rounded-2xl p-4 border border-glass-border">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Registrados</p>
          <p className="text-3xl font-bold text-white mt-1">{registeredCount}<span className="text-lg text-slate-500">/{totalGuests}</span></p>
        </div>
        <div className="bg-surface-100 rounded-2xl p-4 border border-glass-border">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Máximo</p>
          {(() => {
            const maxCount = totalByDay.length > 0 ? Math.max(...totalByDay.map(d => d.count)) : 0;
            const maxDays = totalByDay.filter(d => d.count === maxCount);
            return (
              <>
                <p className="text-3xl font-bold text-accent-green mt-1">{maxCount}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {maxDays.map(d => formatDayOfWeek(d.date)).join(' y ')}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Day counts bar */}
      <div className="bg-surface-100 rounded-2xl p-4 border border-glass-border">
        <h3 className="text-sm font-semibold text-white mb-3">Personas por día</h3>
        <div className="flex gap-1 items-end h-24">
          {totalByDay.map((d, i) => {
            const max = Math.max(...totalByDay.map(x => x.count), 1);
            const height = (d.count / max) * 100;
            return (
              <motion.div
                key={d.date}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <span className="text-[10px] font-bold text-brand-300 mb-1">{d.count}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 min-h-[4px]"
                  style={{ height: `${height}%` }}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {totalByDay.map(d => (
            <div key={d.date} className="flex-1 text-center">
              <p className="text-[9px] text-slate-500 leading-tight">{formatDayOfWeek(d.date)}</p>
              <p className="text-[9px] text-slate-600 leading-tight">{formatDateShort(d.date)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface-100 rounded-2xl border border-glass-border overflow-hidden">
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-sm font-semibold text-white">Cronograma de asistencia</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header row */}
            <div className="flex border-b border-glass-border">
              <div className="w-32 shrink-0 px-3 py-2 text-xs font-medium text-slate-500 bg-surface-50/50">
                Nombre
              </div>
              <div className="flex-1 flex">
                {dates.map(d => (
                  <div key={d} className="flex-1 text-center py-2 text-[10px] text-slate-500 border-l border-glass-border">
                    <div>{formatDayOfWeek(d)}</div>
                    <div className="font-medium">{formatDateShort(d)}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Guest rows */}
            {registered.map((guest, gi) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.03 }}
                className="flex border-b border-glass-border last:border-b-0 hover:bg-surface-50/30 transition-colors"
              >
                <div className="w-32 shrink-0 px-3 py-2.5 flex items-center">
                  <span className="text-xs text-white truncate">{guest.fullName}</span>
                </div>
                <div className="flex-1 flex items-center">
                  {dates.map(d => {
                    const present = guest.arrivalDate && guest.departureDate &&
                      d >= guest.arrivalDate && d <= guest.departureDate;
                    const isArrival = d === guest.arrivalDate;
                    const isDeparture = d === guest.departureDate;
                    return (
                      <div key={d} className="flex-1 flex items-center justify-center border-l border-glass-border py-2">
                        {present && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: gi * 0.03 + 0.1 }}
                            className={`w-full mx-0.5 h-3 ${
                              isArrival && isDeparture ? 'rounded-full' :
                              isArrival ? 'rounded-l-full' :
                              isDeparture ? 'rounded-r-full' : ''
                            } bg-gradient-to-r from-brand-500 to-brand-400`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
            {registered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Aún no hay asistentes registrados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unregistered */}
      {guests && guests.filter(g => !g.isRegistered).length > 0 && (
        <div className="bg-surface-100 rounded-2xl p-4 border border-glass-border">
          <h3 className="text-sm font-semibold text-white mb-2">Sin registrar</h3>
          <div className="flex flex-wrap gap-2">
            {guests.filter(g => !g.isRegistered).map(g => (
              <span key={g.id} className="text-xs bg-accent-amber/10 text-accent-amber px-2.5 py-1 rounded-full">
                {g.fullName}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCars, useCreateCar, useJoinCar, useLeaveCar } from '../hooks/useCars';
import { useGuests } from '../hooks/useGuests';
import { useConfig } from '../hooks/useConfig';
import { getGuestId, isAdmin } from '../lib/identity';
import { getDateRange, formatDateShort, formatDayOfWeek } from '../lib/dates';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { CarDirection, Car } from '../lib/types';

export default function CarsPage() {
  const [direction, setDirection] = useState<CarDirection>('IDA');
  const { data: cars, isLoading, isError, refetch } = useCars(direction);
  const { data: guests } = useGuests();
  const { data: config } = useConfig();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorMessage message="Error cargando coches" onRetry={() => void refetch()} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Direction tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 border border-glass-border">
        {(['IDA', 'VUELTA'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              direction === d
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {d === 'IDA' ? 'Ida' : 'Vuelta'}
          </button>
        ))}
      </div>

      {/* Car list */}
      <AnimatePresence mode="popLayout">
        {cars && cars.map((car, i) => (
          <CarCard key={car.id} car={car} index={i} guests={guests ?? []} />
        ))}
      </AnimatePresence>

      {cars && cars.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-surface-200 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M5 17h14M2 9h20M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No hay coches para {direction === 'IDA' ? 'la ida' : 'la vuelta'}</p>
        </div>
      )}

      {/* Add button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCreate(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-surface-300 text-sm font-medium text-slate-400 hover:border-brand-500/50 hover:text-brand-400 transition-all cursor-pointer"
      >
        + Añadir coche
      </motion.button>

      {/* Create modal */}
      {config && (
        <CreateCarModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          direction={direction}
          tripStart={config.tripStart}
          tripEnd={config.tripEnd}
        />
      )}
    </motion.div>
  );
}

function CarCard({ car, index, guests }: { car: Car; index: number; guests: { id: string; fullName: string }[] }) {
  const myId = getGuestId();
  const joinMutation = useJoinCar();
  const leaveMutation = useLeaveCar();

  const driver = guests.find(g => g.id === car.driverGuestId);
  const isMePassenger = car.passengers.some(p => p.guestId === myId);
  const isMeDriver = car.driverGuestId === myId;
  const isFull = car.passengers.length >= car.passengerSeats;
  const seatsLeft = car.passengerSeats - car.passengers.length;

  const handleDeleteCar = useCallback(async () => {
    if (!confirm('¿Eliminar este coche?')) return;
    await api.delete(`/api/admin/cars/${car.id}`);
    void queryClient.invalidateQueries({ queryKey: ['cars'] });
  }, [car.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-100 rounded-2xl p-4 border border-glass-border space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center">
              {driver?.fullName.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{driver?.fullName ?? 'Conductor'}</p>
              <p className="text-xs text-slate-500">{car.place}</p>
            </div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs bg-surface-200 text-slate-300 px-2 py-0.5 rounded-full">
            {formatDayOfWeek(car.travelDate)} {formatDateShort(car.travelDate)}
          </span>
          {isAdmin() && (
            <button
              onClick={() => void handleDeleteCar()}
              className="block text-xs text-accent-red hover:underline cursor-pointer ml-auto"
              aria-label="Eliminar coche"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Seats visualization */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Plazas:</span>
        <div className="flex gap-1">
          {Array.from({ length: car.passengerSeats }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              className={`w-5 h-5 rounded-full border-2 transition-colors ${
                i < car.passengers.length
                  ? 'bg-brand-500 border-brand-400'
                  : 'bg-transparent border-surface-300'
              }`}
              title={car.passengers[i]?.fullName ?? 'Libre'}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${seatsLeft > 0 ? 'text-accent-green' : 'text-accent-amber'}`}>
          {seatsLeft > 0 ? `${seatsLeft} libre${seatsLeft > 1 ? 's' : ''}` : 'Lleno'}
        </span>
      </div>

      {/* Passengers */}
      {car.passengers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {car.passengers.map(p => (
            <span key={p.guestId} className="text-xs bg-surface-200 text-slate-300 px-2 py-1 rounded-lg">
              {p.fullName}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isMeDriver && (
        <div className="flex gap-2 pt-1">
          {isMePassenger ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => leaveMutation.mutate(car.id)}
              disabled={leaveMutation.isPending}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              Bajarme
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => joinMutation.mutate(car.id)}
              disabled={isFull || joinMutation.isPending}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFull ? 'Lleno' : 'Subirme'}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CreateCarModal({ open, onClose, direction, tripStart, tripEnd }: {
  open: boolean; onClose: () => void; direction: CarDirection; tripStart: string; tripEnd: string;
}) {
  const myId = getGuestId();
  const createMutation = useCreateCar();
  const dates = useMemo(() => getDateRange(tripStart, tripEnd), [tripStart, tripEnd]);

  const [travelDate, setTravelDate] = useState('');
  const [place, setPlace] = useState('');
  const [seats, setSeats] = useState(3);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myId || !travelDate || !place) return;
    await createMutation.mutateAsync({
      driverGuestId: myId,
      direction,
      travelDate,
      place,
      passengerSeats: seats,
    });
    onClose();
  }, [myId, travelDate, place, seats, direction, createMutation, onClose]);

  return (
    <Modal open={open} onClose={onClose} title={`Nuevo coche — ${direction === 'IDA' ? 'Ida' : 'Vuelta'}`}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Fecha</label>
          <div className="grid grid-cols-4 gap-2">
            {dates.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setTravelDate(d)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  travelDate === d
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : 'bg-surface-200 border-glass-border text-slate-400 hover:border-surface-300'
                }`}
              >
                <span className="text-[10px]">{formatDayOfWeek(d)}</span>
                <span>{formatDateShort(d)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Lugar de salida</label>
          <input
            type="text"
            value={place}
            onChange={e => setPlace(e.target.value)}
            placeholder="Ej: Madrid, Atocha"
            className="w-full px-4 py-3 bg-surface-200 border border-glass-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Lugar de salida"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Plazas disponibles (sin contar conductor)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSeats(Math.max(1, seats - 1))}
              className="w-10 h-10 rounded-lg bg-surface-200 text-white hover:bg-surface-300 transition-colors cursor-pointer flex items-center justify-center text-lg font-bold"
            >
              -
            </button>
            <span className="text-xl font-bold text-white w-8 text-center">{seats}</span>
            <button
              type="button"
              onClick={() => setSeats(Math.min(8, seats + 1))}
              className="w-10 h-10 rounded-lg bg-surface-200 text-white hover:bg-surface-300 transition-colors cursor-pointer flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!travelDate || !place || createMutation.isPending}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:opacity-40 transition-all cursor-pointer"
        >
          {createMutation.isPending ? 'Creando...' : 'Crear coche'}
        </button>
      </form>
    </Modal>
  );
}

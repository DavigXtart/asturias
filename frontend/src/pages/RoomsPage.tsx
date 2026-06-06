import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core';
import { useRoomDistribution, useAssignRoom, useUnassignRoom, useRoomBeds, useUpdateRoom } from '../hooks/useRooms';
import { useConfig } from '../hooks/useConfig';
import { getDateRange, formatDateShort, formatDayOfWeek } from '../lib/dates';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import type { RoomDistribution, RoomDistributionGuest, FloorName } from '../lib/types';

const FLOOR_ORDER: FloorName[] = ['PLANTA_3', 'PLANTA_2', 'PLANTA_1', 'HORREO'];

const FLOOR_META: Record<FloorName, { label: string; icon: string; color: string; borderColor: string; bgGradient: string }> = {
  PLANTA_3: {
    label: '2ª Planta',
    icon: 'M3 21h18M3 7v14M21 7v14M5 7l7-4 7 4',
    color: 'text-accent-purple',
    borderColor: 'border-accent-purple/30',
    bgGradient: 'from-accent-purple/10 to-transparent',
  },
  PLANTA_2: {
    label: '1ª Planta',
    icon: 'M3 21h18M3 10v11M21 10v11M5 10l7-4 7 4',
    color: 'text-brand-400',
    borderColor: 'border-brand-400/30',
    bgGradient: 'from-brand-400/10 to-transparent',
  },
  PLANTA_1: {
    label: 'Planta Baja',
    icon: 'M3 21h18M3 13v8M21 13v8M5 13l7-4 7 4',
    color: 'text-accent-green',
    borderColor: 'border-accent-green/30',
    bgGradient: 'from-accent-green/10 to-transparent',
  },
  HORREO: {
    label: 'Hórreo',
    icon: 'M4 21V10l8-6 8 6v11M3 21h18',
    color: 'text-accent-amber',
    borderColor: 'border-accent-amber/30',
    bgGradient: 'from-accent-amber/10 to-transparent',
  },
};

export default function RoomsPage() {
  const { data: config } = useConfig();
  const dates = useMemo(() => config ? getDateRange(config.tripStart, config.tripEnd) : [], [config]);
  const [selectedDay, setSelectedDay] = useState('');
  const activeDay = selectedDay || (dates.length > 0 ? dates[0] : '');

  const { data: distribution, isLoading, isError, refetch } = useRoomDistribution(activeDay);
  const assignMutation = useAssignRoom();
  const unassignMutation = useUnassignRoom();

  const [activeGuest, setActiveGuest] = useState<RoomDistributionGuest | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomDistribution | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const roomsByFloor = useMemo(() => {
    if (!distribution) return {};
    const grouped: Partial<Record<FloorName, RoomDistribution[]>> = {};
    for (const room of distribution.rooms) {
      if (!grouped[room.floor]) grouped[room.floor] = [];
      grouped[room.floor]!.push(room);
    }
    return grouped;
  }, [distribution]);

  const stats = useMemo(() => {
    if (!distribution) return { total: 0, occupied: 0, free: 0 };
    const total = distribution.rooms.reduce((s, r) => s + r.bedCount, 0);
    const occupied = distribution.rooms.reduce((s, r) => s + r.guests.length, 0);
    return { total, occupied, free: total - occupied };
  }, [distribution]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const guest = event.active.data.current as RoomDistributionGuest | undefined;
    if (guest) setActiveGuest(guest);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveGuest(null);
    const { active, over } = event;
    if (!over || !activeDay) return;

    const guestId = String(active.id);
    const targetId = String(over.id);

    if (targetId === 'unassigned') {
      unassignMutation.mutate({ day: activeDay, guestId });
    } else if (targetId.startsWith('room-')) {
      const roomId = targetId.replace('room-', '');
      assignMutation.mutate({ day: activeDay, guestId, roomId });
    }
  }, [activeDay, assignMutation, unassignMutation]);

  if (!config) return <PageSkeleton />;
  if (isLoading && !distribution) return <PageSkeleton />;
  if (isError) return <ErrorMessage message="Error cargando distribución" onRetry={() => void refetch()} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Bed counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Habitaciones</span>
        <div className="flex items-center gap-2 bg-surface-100 border border-glass-border rounded-xl px-3 py-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
            <path d="M2 4v16M22 4v16M2 12h20M2 8h20M6 8v4M18 8v4" />
          </svg>
          <span className="text-sm font-bold text-white">{stats.occupied}/{stats.total}</span>
          <span className="text-[10px] text-slate-500">{stats.free} libre{stats.free !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {dates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`shrink-0 flex flex-col items-center py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              d === activeDay
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-surface-100 border-glass-border text-slate-400 hover:border-surface-300'
            }`}
          >
            <span className="text-[10px] uppercase">{formatDayOfWeek(d)}</span>
            <span className="font-semibold">{formatDateShort(d)}</span>
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Unassigned tray */}
        <UnassignedTray guests={distribution?.unassigned ?? []} day={activeDay} assignedGuests={distribution?.rooms.flatMap(r => r.guests) ?? []} />

        {/* House visualization */}
        <div className="relative">
          {/* House frame */}
          <div className="border-2 border-surface-300/50 rounded-2xl overflow-hidden bg-surface-0/50">
            {/* Roof */}
            <div className="h-3 bg-gradient-to-r from-surface-300/30 via-surface-300/50 to-surface-300/30" />

            {FLOOR_ORDER.filter(f => f !== 'HORREO').map((floor, idx) => {
              const rooms = roomsByFloor[floor];
              const meta = FLOOR_META[floor];
              if (!rooms || rooms.length === 0) return null;
              return (
                <div key={floor} className={`${idx > 0 ? 'border-t border-surface-300/30' : ''}`}>
                  <div className={`bg-gradient-to-r ${meta.bgGradient}`}>
                    {/* Floor label */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-300/20">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={meta.color}>
                        <path d={meta.icon} />
                      </svg>
                      <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                    </div>
                    {/* Rooms grid */}
                    <div className={`grid gap-2 p-3 ${rooms.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {rooms.map(room => (
                        <RoomDropZone key={room.id} room={room} day={activeDay} floorColor={meta.color} onEdit={() => setEditingRoom(room)} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hórreo - separate building */}
          {roomsByFloor['HORREO'] && roomsByFloor['HORREO'].length > 0 && (
            <div className="mt-4">
              <div className={`border-2 ${FLOOR_META.HORREO.borderColor} rounded-2xl overflow-hidden bg-surface-0/50`}>
                <div className={`bg-gradient-to-r ${FLOOR_META.HORREO.bgGradient}`}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-accent-amber/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
                      <path d={FLOOR_META.HORREO.icon} />
                    </svg>
                    <span className="text-xs font-bold text-accent-amber">{FLOOR_META.HORREO.label}</span>
                    <span className="text-[10px] text-slate-500 ml-1">(exterior)</span>
                  </div>
                  <div className="p-3">
                    {roomsByFloor['HORREO']!.map(room => (
                      <RoomDropZone key={room.id} room={room} day={activeDay} floorColor="text-accent-amber" onEdit={() => setEditingRoom(room)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeGuest && (
            <div className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium shadow-xl shadow-brand-500/30 cursor-grabbing">
              {activeGuest.fullName}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Room edit modal */}
      <AnimatePresence>
        {editingRoom && (
          <RoomEditModal room={editingRoom} day={activeDay} onClose={() => setEditingRoom(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UnassignedTray({ guests, day, assignedGuests }: { guests: RoomDistributionGuest[]; day: string; assignedGuests: RoomDistributionGuest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  const unassignMutation = useUnassignRoom();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = useCallback(async () => {
    if (assignedGuests.length === 0) return;
    setClearing(true);
    for (const g of assignedGuests) {
      unassignMutation.mutate({ day, guestId: g.id });
    }
    setClearing(false);
  }, [assignedGuests, day, unassignMutation]);

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface-100 rounded-2xl p-3 border transition-colors min-h-[56px] ${
        isOver ? 'border-brand-500 bg-brand-500/5' : 'border-glass-border'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-medium">
          Sin asignar ({guests.length})
        </p>
        {assignedGuests.length > 0 && (
          <button
            onClick={() => void handleClearAll()}
            disabled={clearing}
            className="text-[10px] text-accent-red hover:text-red-300 transition-colors cursor-pointer font-medium disabled:opacity-50"
          >
            Limpiar todo
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {guests.map(g => (
          <DraggableGuest key={g.id} guest={g} />
        ))}
        {guests.length === 0 && (
          <span className="text-xs text-slate-600">Todos asignados</span>
        )}
      </div>
    </div>
  );
}

function DraggableGuest({ guest }: { guest: RoomDistributionGuest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    data: guest,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing select-none touch-none transition-shadow ${
        isDragging
          ? 'opacity-50 bg-brand-500/30 text-brand-300 shadow-lg'
          : 'bg-surface-200 text-slate-300 hover:bg-surface-300'
      }`}
    >
      {guest.fullName}
    </div>
  );
}

function RoomDropZone({ room, day, floorColor, onEdit }: { room: RoomDistribution; day: string; floorColor: string; onEdit: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `room-${room.id}` });
  const overCapacity = room.guests.length > room.bedCount;
  const unassignMutation = useUnassignRoom();
  const occupancy = room.guests.length;
  const capacity = room.bedCount;

  const stopDnd = (e: React.PointerEvent | React.MouseEvent) => { e.stopPropagation(); };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-2.5 border transition-all min-h-[72px] ${
        isOver
          ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
          : overCapacity
            ? 'border-accent-red/40 bg-accent-red/5'
            : 'border-glass-border bg-surface-0/40'
      }`}
    >
      {/* Room header - tappable to edit */}
      <div
        className="flex items-center justify-between mb-1.5 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        onPointerDown={stopDnd}
        role="button"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold truncate text-white hover:text-brand-300 transition-colors">
            {room.name}
          </span>
          <span className="text-slate-500 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </div>
        <span className={`text-[10px] font-semibold shrink-0 ${
          occupancy === 0 ? 'text-slate-500' :
          occupancy <= capacity ? floorColor : 'text-accent-red'
        }`}>
          {occupancy}/{capacity}
        </span>
      </div>

      {/* Bed type icons */}
      {(room.individualBeds > 0 || room.matrimonioBeds > 0) && (
        <div className="flex items-center gap-2 mb-1.5">
          {room.individualBeds > 0 && (
            <div className="flex items-center gap-0.5" title="Individuales">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <path d="M2 4v16M22 4v16M2 12h20M2 8h20M12 8v4" />
              </svg>
              <span className="text-[10px] text-slate-400 font-medium">{room.individualBeds}</span>
            </div>
          )}
          {room.matrimonioBeds > 0 && (
            <div className="flex items-center gap-0.5" title="Matrimonio">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-purple">
                <path d="M2 4v16M22 4v16M2 12h20M2 8h20" />
              </svg>
              <span className="text-[10px] text-slate-400 font-medium">{room.matrimonioBeds}</span>
            </div>
          )}
        </div>
      )}

      {/* Bed indicators */}
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: capacity }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < occupancy
                ? overCapacity ? 'bg-accent-red' : 'bg-brand-400'
                : 'bg-surface-300/50'
            }`}
          />
        ))}
      </div>

      {/* Guests */}
      <div className="flex flex-wrap gap-1">
        {room.guests.map(g => (
          <div key={g.id} className="group relative">
            <DraggableGuest guest={g} />
            <button
              onPointerDown={stopDnd}
              onClick={(e) => { e.stopPropagation(); unassignMutation.mutate({ day, guestId: g.id }); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label={`Quitar ${g.fullName}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Room Edit Modal ── */
function RoomEditModal({ room, day, onClose }: { room: RoomDistribution; day: string; onClose: () => void }) {
  const { data: beds, isLoading } = useRoomBeds(room.id, day);
  const updateMutation = useUpdateRoom();

  const [localBeds, setLocalBeds] = useState<{ bedType: 'INDIVIDUAL' | 'MATRIMONIO'; position: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (beds && beds.length > 0) {
      setLocalBeds(beds.map(b => ({ bedType: b.bedType, position: b.position })));
    } else if (beds !== undefined) {
      setLocalBeds(
        Array.from({ length: room.bedCount }, (_, i) => ({ bedType: 'INDIVIDUAL' as const, position: i }))
      );
    }
  }, [beds, room.bedCount]);

  const totalCapacity = localBeds.reduce((sum, b) => sum + (b.bedType === 'MATRIMONIO' ? 2 : 1), 0);

  const addBed = (type: 'INDIVIDUAL' | 'MATRIMONIO') => {
    setLocalBeds(prev => [...prev, { bedType: type, position: prev.length }]);
  };

  const removeBed = (index: number) => {
    setLocalBeds(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, position: i })));
  };

  const toggleBedType = (index: number) => {
    setLocalBeds(prev => prev.map((b, i) =>
      i === index ? { ...b, bedType: b.bedType === 'INDIVIDUAL' ? 'MATRIMONIO' : 'INDIVIDUAL' } : b
    ));
  };

  const handleSave = () => {
    setError('');
    updateMutation.mutate(
      { id: room.id, bedCount: totalCapacity, day, beds: localBeds },
      { onSuccess: onClose, onError: () => setError('Error al guardar. Comprueba que eres admin.') },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] bg-surface-100 border border-glass-border rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-300/30">
          <h3 className="text-sm font-bold text-white">{room.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center text-sm text-slate-500 py-8">Cargando...</div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-3 py-2 text-xs text-accent-red">
                  {error}
                </div>
              )}

              {/* Capacity summary */}
              <div className="flex items-center justify-between bg-surface-0/60 rounded-xl px-3 py-2 border border-glass-border">
                <span className="text-xs text-slate-400">Capacidad total</span>
                <span className="text-sm font-bold text-white">{totalCapacity} persona{totalCapacity !== 1 ? 's' : ''}</span>
              </div>

              {/* Beds list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Camas</p>
                {localBeds.map((bed, i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-0/40 rounded-xl px-3 py-2 border border-glass-border">
                    {/* Bed icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      bed.bedType === 'MATRIMONIO' ? 'bg-accent-purple/20' : 'bg-brand-500/20'
                    }`}>
                      {bed.bedType === 'MATRIMONIO' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-purple">
                          <path d="M2 4v16M22 4v16M2 12h20M2 8h20" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                          <path d="M2 4v16M22 4v16M2 12h20M2 8h20M12 8v4" />
                        </svg>
                      )}
                    </div>

                    {/* Type toggle */}
                    <button
                      onClick={() => toggleBedType(i)}
                      className="flex-1 text-left cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-white">
                        {bed.bedType === 'MATRIMONIO' ? 'Matrimonio' : 'Individual'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {bed.bedType === 'MATRIMONIO' ? '2 personas' : '1 persona'}
                        {' · Toca para cambiar'}
                      </p>
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeBed(i)}
                      className="w-7 h-7 rounded-lg bg-accent-red/10 hover:bg-accent-red/20 text-accent-red flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Quitar cama"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add bed buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addBed('INDIVIDUAL')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-surface-300/50 text-slate-400 hover:border-brand-500/50 hover:text-brand-400 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-xs font-medium">Individual</span>
                  </button>
                  <button
                    onClick={() => addBed('MATRIMONIO')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-surface-300/50 text-slate-400 hover:border-accent-purple/50 hover:text-accent-purple transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-xs font-medium">Matrimonio</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-surface-300/30">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 bg-surface-200 hover:bg-surface-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

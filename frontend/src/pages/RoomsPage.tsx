import { useState, useMemo, useCallback } from 'react';
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
} from '@dnd-kit/core';
import { useRoomDistribution, useAssignRoom, useUnassignRoom } from '../hooks/useRooms';
import { useConfig } from '../hooks/useConfig';
import { isAdmin } from '../lib/identity';
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
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

  // Bed stats
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
      {/* Header: Day selector + Stats */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
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

        {/* Bed counter */}
        <div className="shrink-0 bg-surface-100 border border-glass-border rounded-xl px-3 py-2 text-center min-w-[80px]">
          <div className="flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
              <path d="M2 4v16M22 4v16M2 12h20M2 8h20M6 8v4M18 8v4" />
            </svg>
            <span className="text-sm font-bold text-white">{stats.occupied}/{stats.total}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{stats.free} libre{stats.free !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Unassigned tray */}
        <UnassignedTray guests={distribution?.unassigned ?? []} />

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
                        <RoomDropZone key={room.id} room={room} day={activeDay} floorColor={meta.color} />
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
                      <RoomDropZone key={room.id} room={room} day={activeDay} floorColor="text-accent-amber" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeGuest && (
            <div className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium shadow-xl shadow-brand-500/30 cursor-grabbing">
              {activeGuest.fullName}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </motion.div>
  );
}

function UnassignedTray({ guests }: { guests: RoomDistributionGuest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface-100 rounded-2xl p-3 border transition-colors min-h-[56px] ${
        isOver ? 'border-brand-500 bg-brand-500/5' : 'border-glass-border'
      }`}
    >
      <p className="text-xs text-slate-500 mb-2 font-medium">
        Sin asignar ({guests.length})
      </p>
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
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layout
      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging
          ? 'opacity-50 bg-brand-500/30 text-brand-300 shadow-lg'
          : 'bg-surface-200 text-slate-300 hover:bg-surface-300'
      }`}
    >
      {guest.fullName}
    </motion.div>
  );
}

function RoomDropZone({ room, day, floorColor }: { room: RoomDistribution; day: string; floorColor: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `room-${room.id}` });
  const overCapacity = room.guests.length > room.bedCount;
  const unassignMutation = useUnassignRoom();
  const occupancy = room.guests.length;
  const capacity = room.bedCount;

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
      {/* Room header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white truncate">{room.name}</span>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-semibold ${
            occupancy === 0 ? 'text-slate-500' :
            occupancy <= capacity ? floorColor : 'text-accent-red'
          }`}>
            {occupancy}/{capacity}
          </span>
        </div>
      </div>

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
            {isAdmin() && (
              <button
                onClick={() => unassignMutation.mutate({ day, guestId: g.id })}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Quitar ${g.fullName}`}
              >
                x
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

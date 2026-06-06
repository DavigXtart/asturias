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
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { RoomDistribution, RoomDistributionGuest, FloorName } from '../lib/types';

const FLOOR_LABELS: Record<FloorName, string> = {
  PLANTA_1: 'Planta 1',
  PLANTA_2: 'Planta 2',
  PLANTA_3: 'Planta 3',
  HORREO: 'Horreo',
};

const FLOOR_COLORS: Record<FloorName, string> = {
  PLANTA_1: 'from-brand-600/30 to-brand-500/10',
  PLANTA_2: 'from-accent-green/30 to-accent-green/5',
  PLANTA_3: 'from-accent-purple/30 to-accent-purple/5',
  HORREO: 'from-accent-amber/30 to-accent-amber/5',
};

const FLOOR_ORDER: FloorName[] = ['PLANTA_3', 'PLANTA_2', 'PLANTA_1', 'HORREO'];

export default function RoomsPage() {
  const { data: config } = useConfig();
  const dates = useMemo(() => config ? getDateRange(config.tripStart, config.tripEnd) : [], [config]);
  const [selectedDay, setSelectedDay] = useState('');
  const activeDay = selectedDay || (dates.length > 0 ? dates[0] : '');

  const { data: distribution, isLoading, isError, refetch } = useRoomDistribution(activeDay);
  const assignMutation = useAssignRoom();
  const unassignMutation = useUnassignRoom();

  const [activeGuest, setActiveGuest] = useState<RoomDistributionGuest | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const guest = event.active.data.current as RoomDistributionGuest | undefined;
    if (guest) setActiveGuest(guest);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveGuest(null);
    const { active, over } = event;
    if (!over || !activeDay) return;

    const guestId = active.id as number;
    const targetId = String(over.id);

    if (targetId === 'unassigned') {
      // Remove from room
      unassignMutation.mutate({ day: activeDay, guestId });
    } else if (targetId.startsWith('room-')) {
      const roomId = Number(targetId.replace('room-', ''));
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
      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Unassigned tray */}
        <UnassignedTray guests={distribution?.unassigned ?? []} />

        {/* House plan */}
        <div className="space-y-3">
          {FLOOR_ORDER.map(floor => {
            const rooms = roomsByFloor[floor];
            if (!rooms || rooms.length === 0) return null;
            return (
              <motion.div
                key={floor}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className={`rounded-2xl border border-glass-border overflow-hidden bg-gradient-to-b ${FLOOR_COLORS[floor]}`}>
                  <div className="px-4 py-2.5 border-b border-glass-border">
                    <h3 className="text-sm font-bold text-white">{FLOOR_LABELS[floor]}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {rooms.map(room => (
                      <RoomDropZone key={room.id} room={room} day={activeDay} />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <DragOverlay>
          {activeGuest && (
            <div className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium shadow-xl shadow-brand-500/30 cursor-grabbing">
              {activeGuest.fullName}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Admin: create room */}
      {isAdmin() && (
        <>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateRoom(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-surface-300 text-sm font-medium text-slate-400 hover:border-brand-500/50 hover:text-brand-400 transition-all cursor-pointer"
          >
            + Añadir habitación
          </motion.button>
          <AnimatePresence>
            {showCreateRoom && <CreateRoomForm onClose={() => setShowCreateRoom(false)} />}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

function UnassignedTray({ guests }: { guests: RoomDistributionGuest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface-100 rounded-2xl p-3 border transition-colors min-h-[60px] ${
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

function RoomDropZone({ room, day }: { room: RoomDistribution; day: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `room-${room.id}` });
  const overCapacity = room.guests.length > room.bedCount;
  const unassignMutation = useUnassignRoom();

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-2.5 border transition-all min-h-[80px] ${
        isOver
          ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
          : overCapacity
            ? 'border-accent-amber/50 bg-accent-amber/5'
            : 'border-glass-border bg-surface-0/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-white truncate">{room.name}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: room.bedCount }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < room.guests.length ? 'bg-brand-400' : 'bg-surface-400/50'
              }`}
            />
          ))}
        </div>
      </div>
      {overCapacity && (
        <p className="text-[10px] text-accent-amber font-medium mb-1">
          Excede capacidad ({room.guests.length}/{room.bedCount})
        </p>
      )}
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

function CreateRoomForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [floor, setFloor] = useState<FloorName>('PLANTA_1');
  const [bedCount, setBedCount] = useState(2);
  const [position, setPosition] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    try {
      await api.post('/api/admin/rooms', { name, floor, bedCount, position });
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [name, floor, bedCount, position, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-surface-100 rounded-2xl p-4 border border-glass-border overflow-hidden"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la habitación"
          className="w-full px-4 py-2.5 bg-surface-200 border border-glass-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Nombre de la habitación"
        />
        <div className="grid grid-cols-4 gap-1.5">
          {FLOOR_ORDER.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFloor(f)}
              className={`py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                floor === f ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-surface-200 border-glass-border text-slate-400'
              }`}
            >
              {FLOOR_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Camas:</label>
          <button type="button" onClick={() => setBedCount(Math.max(1, bedCount - 1))} className="w-8 h-8 rounded-lg bg-surface-200 text-white cursor-pointer">-</button>
          <span className="text-sm font-bold text-white">{bedCount}</span>
          <button type="button" onClick={() => setBedCount(bedCount + 1)} className="w-8 h-8 rounded-lg bg-surface-200 text-white cursor-pointer">+</button>
          <label className="text-xs text-slate-400 ml-4">Pos:</label>
          <input type="number" value={position} onChange={e => setPosition(Number(e.target.value))} className="w-16 px-2 py-1 bg-surface-200 border border-glass-border rounded-lg text-white text-sm" aria-label="Posición" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={!name || saving} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-40 cursor-pointer text-sm">
            {saving ? 'Guardando...' : 'Crear'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-400 bg-surface-200 hover:bg-surface-300 cursor-pointer text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </motion.div>
  );
}

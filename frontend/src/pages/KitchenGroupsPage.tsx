import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGuests } from '../hooks/useGuests';
import { isAdmin } from '../lib/identity';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import type { DaySchedule } from '../lib/types';

interface KitchenMember {
  guestId: string;
  guestName: string;
}

interface KitchenGroupData {
  groupNumber: number;
  members: KitchenMember[];
}

const GROUP_COLORS = [
  { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500' },
  { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500' },
  { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500' },
  { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500' },
];

function useKitchenGroups() {
  return useQuery<KitchenGroupData[]>({
    queryKey: ['kitchen-groups'],
    queryFn: async () => (await api.get<KitchenGroupData[]>('/api/kitchen/groups')).data,
  });
}

function useKitchenSchedule() {
  return useQuery<DaySchedule[]>({
    queryKey: ['kitchen-schedule'],
    queryFn: async () => (await api.get<DaySchedule[]>('/api/kitchen/schedule')).data,
  });
}

export default function KitchenGroupsPage() {
  const { data: groups, isLoading, isError, refetch } = useKitchenGroups();
  const { data: guests } = useGuests();
  const [addingTo, setAddingTo] = useState<number | null>(null);

  const assignedGuestIds = useMemo(() => {
    if (!groups) return new Set<string>();
    const ids = new Set<string>();
    for (const g of groups) {
      for (const m of g.members) ids.add(m.guestId);
    }
    return ids;
  }, [groups]);

  const unassignedGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter(g => g.isRegistered && !assignedGuestIds.has(g.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [guests, assignedGuestIds]);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorMessage message="Error cargando grupos" onRetry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      {/* Groups grid */}
      <div className="grid grid-cols-2 gap-3">
        {(groups ?? []).map((group, idx) => (
          <GroupCard
            key={group.groupNumber}
            group={group}
            color={GROUP_COLORS[idx]}
            isAddingTo={addingTo === group.groupNumber}
            onToggleAdd={() => setAddingTo(addingTo === group.groupNumber ? null : group.groupNumber)}
            unassignedGuests={unassignedGuests}
          />
        ))}
      </div>

      {/* Schedule */}
      <ScheduleSection />
    </div>
  );
}

function GroupCard({ group, color, isAddingTo, onToggleAdd, unassignedGuests }: {
  group: KitchenGroupData;
  color: typeof GROUP_COLORS[0];
  isAddingTo: boolean;
  onToggleAdd: () => void;
  unassignedGuests: { id: string; fullName: string }[];
}) {
  const assignMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.put(`/api/kitchen/groups/${group.groupNumber}/members`, { guestId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-schedule'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.delete(`/api/kitchen/groups/${group.groupNumber}/members/${guestId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-schedule'] });
    },
  });

  const handleAssign = useCallback((guestId: string) => {
    assignMutation.mutate(guestId);
  }, [assignMutation]);

  return (
    <motion.div
      layout
      className={`rounded-2xl p-3 border ${color.border} ${color.bg} space-y-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${color.badge} flex items-center justify-center text-xs font-bold text-white`}>
            {group.groupNumber}
          </div>
          <span className={`text-sm font-bold ${color.text}`}>Grupo {group.groupNumber}</span>
        </div>
        <span className="text-[10px] text-slate-500">{group.members.length} pers.</span>
      </div>

      {/* Members */}
      <div className="flex flex-wrap gap-1">
        {group.members.map(m => (
          <div key={m.guestId} className="group relative">
            <span className="text-xs bg-surface-200/80 text-slate-300 px-2 py-1 rounded-lg inline-block">
              {m.guestName}
            </span>
            {isAdmin() && (
              <button
                onClick={() => removeMutation.mutate(m.guestId)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Quitar ${m.guestName}`}
              >
                x
              </button>
            )}
          </div>
        ))}
        {group.members.length === 0 && (
          <span className="text-[10px] text-slate-600">Sin miembros</span>
        )}
      </div>

      {/* Add button (admin) */}
      {isAdmin() && (
        <>
          <button
            onClick={onToggleAdd}
            className={`w-full py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border border-dashed ${
              isAddingTo ? 'border-brand-500 text-brand-400' : 'border-surface-300 text-slate-500 hover:border-brand-500/50'
            }`}
          >
            {isAddingTo ? 'Cerrar' : '+ Añadir'}
          </button>

          <AnimatePresence>
            {isAddingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1 pt-1">
                  {unassignedGuests.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleAssign(g.id)}
                      className="text-[10px] bg-surface-200 text-slate-300 px-2 py-1 rounded-lg hover:bg-brand-500/20 hover:text-brand-300 transition-colors cursor-pointer"
                    >
                      {g.fullName}
                    </button>
                  ))}
                  {unassignedGuests.length === 0 && (
                    <span className="text-[10px] text-slate-600">Todos asignados</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

const MEAL_LABELS: Record<string, string> = {
  DESAYUNO: 'Desayuno',
  COMIDA: 'Comida',
  CENA: 'Cena',
};

const MEAL_ICONS: Record<string, string> = {
  DESAYUNO: '\u2615',
  COMIDA: '\ud83c\udf5d',
  CENA: '\ud83c\udf19',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function ScheduleSection() {
  const { data: schedule, isLoading, isError } = useKitchenSchedule();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Horario de cocina</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-surface-100 rounded-2xl border border-glass-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !schedule) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Horario de cocina</h3>
      {schedule.map((day, i) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-surface-100 rounded-2xl border border-glass-border p-3 space-y-2"
        >
          <p className="text-xs font-semibold text-slate-300">{formatDate(day.date)}</p>
          <div className="space-y-1.5">
            {day.meals.map(meal => {
              const color = GROUP_COLORS[meal.groupNumber - 1];
              return (
                <div key={meal.meal} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 w-20">
                    {MEAL_ICONS[meal.meal]} {MEAL_LABELS[meal.meal]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full ${color.badge} flex items-center justify-center text-[10px] font-bold text-white`}>
                      {meal.groupNumber}
                    </div>
                    <span className={`text-xs font-medium ${color.text}`}>Grupo {meal.groupNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

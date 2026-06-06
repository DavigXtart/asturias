import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGuests } from '../hooks/useGuests';
import { isAdmin } from '../lib/identity';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { PageSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';

interface KitchenMember {
  guestId: string;
  guestName: string;
}

interface KitchenGroupData {
  groupNumber: number;
  members: KitchenMember[];
}

interface DayBalance {
  date: string;
  groupCounts: Record<number, number>;
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

function useKitchenBalance() {
  return useQuery<DayBalance[]>({
    queryKey: ['kitchen-balance'],
    queryFn: async () => (await api.get<DayBalance[]>('/api/kitchen/balance')).data,
  });
}

export default function KitchenGroupsPage() {
  const { data: groups, isLoading, isError, refetch } = useKitchenGroups();
  const { data: balance } = useKitchenBalance();
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

      {/* Balance table */}
      {balance && balance.length > 0 && (
        <BalanceTable balance={balance} />
      )}
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
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.delete(`/api/kitchen/groups/${group.groupNumber}/members/${guestId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-balance'] });
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

function BalanceTable({ balance }: { balance: DayBalance[] }) {
  return (
    <div className="bg-surface-100 rounded-2xl border border-glass-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-glass-border">
        <h3 className="text-sm font-semibold text-white">Personas por grupo / día</h3>
        <p className="text-[10px] text-slate-500">Comida + cena por grupo según asistencia</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Día</th>
              {[1, 2, 3, 4].map(g => (
                <th key={g} className="px-3 py-2 text-center">
                  <div className={`w-5 h-5 mx-auto rounded-full ${GROUP_COLORS[g - 1].badge} flex items-center justify-center text-[9px] font-bold text-white`}>
                    {g}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {balance.map(day => (
              <tr key={day.date} className="border-b border-glass-border last:border-b-0 hover:bg-surface-50/30">
                <td className="px-3 py-2 text-slate-400">{day.date}</td>
                {[1, 2, 3, 4].map(g => (
                  <td key={g} className="px-3 py-2 text-center text-slate-300 font-medium">
                    {day.groupCounts[g] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { Room, DayDistribution, Bed } from '../lib/types';

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get<Room[]>('/api/rooms')).data,
  });
}

export function useRoomDistribution(day: string) {
  return useQuery<DayDistribution>({
    queryKey: ['rooms', 'distribution', day],
    queryFn: async () => (await api.get<DayDistribution>('/api/rooms/distribution', { params: { day } })).data,
    refetchInterval: 5000,
    enabled: !!day,
  });
}

export function useAssignRoom() {
  return useMutation({
    mutationFn: async (data: { day: string; guestId: string; roomId: string }) => {
      return (await api.put('/api/rooms/assign', data)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUnassignRoom() {
  return useMutation({
    mutationFn: async (data: { day: string; guestId: string }) => {
      return (await api.delete('/api/rooms/assign', { params: data })).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useRoomBeds(roomId: string | null) {
  return useQuery<Bed[]>({
    queryKey: ['rooms', 'beds', roomId],
    queryFn: async () => (await api.get<Bed[]>(`/api/rooms/${roomId}/beds`)).data,
    enabled: !!roomId,
  });
}

export function useUpdateRoom() {
  return useMutation({
    mutationFn: async (data: { id: string; name?: string; bedCount: number; beds: { bedType: string; position: number }[] }) => {
      const { id, ...body } = data;
      return (await api.put(`/api/rooms/${id}`, body)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

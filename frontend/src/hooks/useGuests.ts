import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { Guest } from '../lib/types';

export function useGuests() {
  return useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => (await api.get<Guest[]>('/api/guests')).data,
  });
}

export function useRegisterGuest() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { cityId?: string; cityOther?: string; arrivalDate: string; departureDate: string; canDrive: boolean } }) => {
      return (await api.put(`/api/guests/${id}/register`, data)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

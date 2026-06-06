import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { TripConfig } from '../lib/types';

export function useConfig() {
  return useQuery<TripConfig>({
    queryKey: ['config'],
    queryFn: async () => (await api.get<TripConfig>('/api/config')).data,
    staleTime: 5 * 60_000,
  });
}

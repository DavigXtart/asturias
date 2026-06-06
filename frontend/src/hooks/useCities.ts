import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { City } from '../lib/types';

export function useCities() {
  return useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: async () => (await api.get<City[]>('/api/cities')).data,
  });
}

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { CostumeResult } from '../lib/types';

export function useCostumeMe() {
  return useQuery<CostumeResult>({
    queryKey: ['costume', 'me'],
    queryFn: async () => (await api.get<CostumeResult>('/api/costume/me')).data,
    retry: false,
  });
}

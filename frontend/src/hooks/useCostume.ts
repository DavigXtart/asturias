import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { CostumeResult, BallsView } from '../lib/types';

export function useCostumeMe() {
  return useQuery<CostumeResult>({
    queryKey: ['costume', 'me'],
    queryFn: async () => (await api.get<CostumeResult>('/api/costume/me')).data,
    retry: false,
  });
}

export function useBallsView() {
  return useQuery<BallsView>({
    queryKey: ['costume', 'balls'],
    queryFn: async () => (await api.get<BallsView>('/api/costume/balls')).data,
    retry: false,
  });
}

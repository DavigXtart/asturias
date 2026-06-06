import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { Car, CarDirection } from '../lib/types';

export function useCars(direction: CarDirection) {
  return useQuery<Car[]>({
    queryKey: ['cars', direction],
    queryFn: async () => (await api.get<Car[]>('/api/cars', { params: { direction } })).data,
  });
}

export function useCreateCar() {
  return useMutation({
    mutationFn: async (data: { driverGuestId: string; direction: CarDirection; travelDate: string; place: string; passengerSeats: number }) => {
      return (await api.post('/api/cars', data)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useJoinCar() {
  return useMutation({
    mutationFn: async (carId: string) => {
      return (await api.post(`/api/cars/${carId}/join`)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useLeaveCar() {
  return useMutation({
    mutationFn: async (carId: string) => {
      return (await api.delete(`/api/cars/${carId}/leave`)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInteractions, createInteraction, updateInteraction, getInteraction, getCompassInteractionsForDate, Interaction } from '../data-provider/Interactions';

export function useInteractions(params?: {
  kind?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  return useQuery(['interactions', params], () => getInteractions(params));
}

export function useInteraction(id: string) {
  return useQuery(['interaction', id], () => getInteraction(id), { enabled: !!id });
}

export function useCompassInteractionsForDate(date: string) {
  return useQuery(['compassInteractions', date], () => getCompassInteractionsForDate(date), { 
    enabled: !!date 
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Interaction) => createInteraction(data),
    onSuccess: () => {
      // Invalidate all interactions queries
      queryClient.invalidateQueries(['interactions']);
      
      // Invalidate all compass view queries (including date-specific ones)
      queryClient.invalidateQueries({ queryKey: ['compassView'] });
      
      // Invalidate all wins view queries
      queryClient.invalidateQueries({ queryKey: ['winsView'] });
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Interaction> }) => updateInteraction(id, data),
    onSuccess: () => {
      // Invalidate all interactions queries
      queryClient.invalidateQueries(['interactions']);
      
      // Invalidate all compass view queries (including date-specific ones)
      queryClient.invalidateQueries({ queryKey: ['compassView'] });
      
      // Invalidate all wins view queries
      queryClient.invalidateQueries({ queryKey: ['winsView'] });
    },
  });
} 
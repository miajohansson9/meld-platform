import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateDailySummary } from '~/data-provider';

export const useGenerateDailySummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    { summary: string },
    Error,
    { date: string; eveningReflectionText: string }
  >({
    mutationFn: generateDailySummary,
    onSuccess: () => {
      // Invalidate compass view queries to show updated daily summary
      queryClient.invalidateQueries({ queryKey: ['compassView'] });
    },
    onError: (error) => {
      console.error('Error generating daily summary:', error);
      toast.error('Failed to generate daily summary. Please try again.');
    },
  });
}; 
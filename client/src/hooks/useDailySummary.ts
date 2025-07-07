import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateDailySummary } from '~/data-provider';

export const useGenerateDailySummary = () => {
  return useMutation<
    { summary: string },
    Error,
    { date: string; eveningReflectionText: string }
  >({
    mutationFn: generateDailySummary,
    onError: (error) => {
      console.error('Error generating daily summary:', error);
      toast.error('Failed to generate daily summary. Please try again.');
    },
  });
}; 
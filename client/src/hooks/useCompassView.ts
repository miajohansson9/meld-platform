import { useQuery } from '@tanstack/react-query';
import { getCompassViews, CompassView } from '../data-provider/Views';

export function useCompassView(date?: string) {
  return useQuery<CompassView[]>(
    ['compassView', date], 
    () => getCompassViews(date ? { date } : undefined),
    {
      staleTime: 30000, // 30 seconds
      retry: 1
    }
  );
} 
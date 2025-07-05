import { useQuery } from '@tanstack/react-query';
import { getWinsViews, WinsView } from '../data-provider/Views';

export function useWinsView(date?: string) {
  return useQuery<WinsView[]>(['winsView', date], () => getWinsViews(date ? { date } : undefined));
} 
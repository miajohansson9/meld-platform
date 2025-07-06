import { dataService } from 'librechat-data-provider';

export type CompletionBand = 0 | 20 | 40 | 60 | 80 | 100;

export const COMPLETION_BANDS: CompletionBand[] = [0, 20, 40, 60, 80, 100] as const;

export const BLOCKER_OPTIONS = [
  { value: 'priorityShift', label: 'Priority shift' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'lowEnergy', label: 'Low energy' },
  { value: 'overScoped', label: 'Over-scoped' },
  { value: 'other', label: 'Other' },
] as const;

export interface CompassView {
  _id?: string;
  user?: string;
  date: string;
  mood?: number;
  energy?: number;
  alignment?: number; // legacy
  note?: string;
  reflectionInteractionId?: string;
  // Evening reflection fields
  completion?: number;
  blocker?: string;
  improvementNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WinsView {
  _id: string;
  user: string;
  achievedAt: string;
  titleInteractionId?: string;
  descriptionInteractionId?: string;
}

export async function getCompassViews(params?: { date?: string }) {
  const res = await dataService.getCompassViews(params);
  return res;
}

export async function getWinsViews(params?: { date?: string }) {
  const res = await dataService.getWinsViews(params);
  return res;
} 
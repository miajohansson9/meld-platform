import { dataService } from 'librechat-data-provider';

export interface CompassView {
  _id?: string;
  user?: string;
  date: string;
  mood?: number;
  energy?: number;
  note?: string;
  dailySummary?: string;
  eveningNote?: string;
  completion?: number;
  reflectionInteractionId?: string;
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
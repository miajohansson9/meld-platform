import { dataService } from 'librechat-data-provider';

export interface Interaction {
  _id?: string;
  kind: 'onboarding' | 'fragment' | 'compass' | 'goal' | 'win' | 'reflection';
  promptText?: string;
  responseText?: string;
  numericAnswer?: number;
  captureMethod?: 'text' | 'slider' | 'voice' | 'image' | 'web';
  interactionMeta?: Record<string, any>;
  mentorFeedId?: string;
  isPrivate?: boolean;
  capturedAt?: string;
}

export async function createInteraction(data: Interaction) {
  const res = await dataService.createInteraction(data);
  return res.data;
}

export async function getInteractions(params?: {
  kind?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const res = await dataService.getInteractions(params);
  return res.data;
}

export async function getInteraction(id: string) {
  const res = await dataService.getInteraction(id);
  return res.data;
} 
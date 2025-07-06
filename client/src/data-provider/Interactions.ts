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
  return res;
}

export async function updateInteraction(id: string, data: Partial<Interaction>) {
  const res = await dataService.updateInteraction(id, data);
  return res;
}

export async function getInteractions(params?: {
  kind?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const res = await dataService.getInteractions(params);
  return res.interactions || res; // Handle both wrapped and direct responses
}

export async function getInteraction(id: string) {
  const res = await dataService.getInteraction(id);
  return res;
}

export async function getCompassInteractionsForDate(date: string) {
  // Get compass interactions for a specific date
  const res = await dataService.getInteractions({
    kind: 'compass',
    limit: 100, // Get more to ensure we get all compass interactions for the day
    sortBy: 'capturedAt',
    sortDirection: 'desc'
  });
  
  // Filter interactions for the specific date
  const targetDate = new Date(date);
  const interactions = res?.interactions || [];
  
  return interactions.filter((interaction: any) => {
    const interactionDate = new Date(interaction.capturedAt);
    return interactionDate.toDateString() === targetDate.toDateString();
  });
} 
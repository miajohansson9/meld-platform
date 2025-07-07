import { dataService } from 'librechat-data-provider';

export interface DailySummaryRequest {
  date: string;
  eveningReflectionText: string;
}

export interface DailySummaryResponse {
  summary: string;
}

export const generateDailySummary = async (data: DailySummaryRequest): Promise<DailySummaryResponse> => {
  return dataService.generateDailySummary(data);
}; 
import { useState, useEffect, useCallback, useRef } from 'react';

interface TranscriptionStatus {
  stage_id: number;
  mentor_response_id: string;
  status: 'pending' | 'processing' | 'transcribed' | 'failed';
  duration_ms: number;
  created_at: string;
  progress: number;
}

interface UseTranscriptionStatusReturn {
  statuses: TranscriptionStatus[];
  isLoading: boolean;
  error: string | null;
  hasBackgroundProcessing: boolean;
  pendingStages: number[];
  refresh: () => Promise<void>;
}

/**
 * Hook to track background transcription status for mentor interview responses
 * Polls the /progress endpoint to get real-time updates on transcription jobs
 */
export const useTranscriptionStatus = (
  accessToken: string | undefined,
  enabled = true,
  pollInterval = 3000 // Poll every 3 seconds
): UseTranscriptionStatusReturn => {
  const [statuses, setStatuses] = useState<TranscriptionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch transcription statuses from the API
  const fetchStatuses = useCallback(async () => {
    if (!accessToken || !enabled) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(
        `/api/mentor-interview/${accessToken}/progress`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transcription status: ${response.status}`);
      }

      const data = await response.json();
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setStatuses(data.statuses || []);
      }
    } catch (err) {
      console.error('Error fetching transcription status:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [accessToken, enabled]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchStatuses();
  }, [fetchStatuses]);

  // Set up polling
  useEffect(() => {
    if (!accessToken || !enabled) {
      return;
    }

    // Initial fetch
    setIsLoading(true);
    fetchStatuses();

    // Set up polling interval
    pollIntervalRef.current = setInterval(fetchStatuses, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [accessToken, enabled, pollInterval, fetchStatuses]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Derived state
  const hasBackgroundProcessing = statuses.some(
    status => status.status === 'pending' || status.status === 'processing'
  );

  const pendingStages = statuses
    .filter(status => status.status === 'pending' || status.status === 'processing')
    .map(status => status.stage_id);

  return {
    statuses,
    isLoading,
    error,
    hasBackgroundProcessing,
    pendingStages,
    refresh,
  };
}; 
/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect, useCallback } from 'react';

interface FinalQuestionWaitOverlayProps {
  accessToken: string;
  stageId: number;
  isVisible: boolean;
  onTranscriptionComplete: () => void;
  onTimeout: () => void;
  maxWaitTime?: number; // Maximum wait time in milliseconds
  pollInterval?: number; // Polling interval in milliseconds
}

/**
 * Overlay that appears after final question recording is complete
 * Waits briefly for transcription to finish before proceeding to review
 * Provides fallback timeout to ensure user doesn't wait indefinitely
 */
const FinalQuestionWaitOverlay: React.FC<FinalQuestionWaitOverlayProps> = ({
  accessToken,
  stageId,
  isVisible,
  onTranscriptionComplete,
  onTimeout,
  maxWaitTime = 15000, // 15 seconds max wait
  pollInterval = 2000, // Poll every 2 seconds
}) => {
  const [waitTime, setWaitTime] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);

  // Poll for transcription completion
  const checkTranscriptionStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/mentor-interview/${accessToken}/response/${stageId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Check if transcription is complete (has response_text and status is 'transcribed')
        if (data.response_text && data.response_text.trim().length > 0 && data.status === 'transcribed') {
          setIsPolling(false);
          onTranscriptionComplete();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking transcription status:', error);
      return false;
    }
  }, [accessToken, stageId, onTranscriptionComplete]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    setIsPolling(false);
    onTimeout();
  }, [onTimeout]);

  // Main effect for managing the wait process
  useEffect(() => {
    if (!isVisible) {
      setWaitTime(0);
      setProgress(0);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setWaitTime(0);
    setProgress(0);

    // Immediate check
    checkTranscriptionStatus();

    // Set up polling interval
    const pollTimer = setInterval(async () => {
      if (!isPolling) return;
      
      const isComplete = await checkTranscriptionStatus();
      if (!isComplete) {
        setWaitTime(prev => prev + pollInterval);
        setProgress(prev => Math.min((prev + pollInterval) / maxWaitTime * 100, 100));
      }
    }, pollInterval);

    // Set up timeout
    const timeoutTimer = setTimeout(() => {
      if (isPolling) {
        handleTimeout();
      }
    }, maxWaitTime);

    return () => {
      clearInterval(pollTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isVisible, isPolling, pollInterval, maxWaitTime, checkTranscriptionStatus, handleTimeout]);

  // Format wait time for display
  const formatWaitTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#B04A2F] mx-auto mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Finalizing Your Response
          </h3>
          
          <p className="text-gray-600">
            We're processing your final answer to ensure the best review experience.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-[#B04A2F] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>Processing...</span>
            <span>{formatWaitTime(waitTime)} / {formatWaitTime(maxWaitTime)}</span>
          </div>
        </div>

        {/* Status messages */}
        <div className="mb-6 text-sm text-gray-600">
          {waitTime < 5000 && "Transcribing your audio..."}
          {waitTime >= 5000 && waitTime < 10000 && "Almost ready..."}
          {waitTime >= 10000 && "Finishing up..."}
        </div>

        {/* Skip option for long waits */}
        {waitTime >= 8000 && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-3">
              Taking longer than expected?
            </p>
            <button
              onClick={handleTimeout}
              className="text-sm text-[#B04A2F] hover:text-[#8a3a23] underline font-medium"
            >
              Continue to review →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalQuestionWaitOverlay; 
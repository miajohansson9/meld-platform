/* eslint-disable i18next/no-literal-string */
import React from 'react';

interface BackgroundTranscriptionIndicatorProps {
  hasBackgroundProcessing: boolean;
  pendingStages: number[];
  isVisible?: boolean;
}

/**
 * Displays a subtle indicator when audio transcription is happening in the background
 * Shows in the header area to inform users their previous answers are being processed
 */
const BackgroundTranscriptionIndicator: React.FC<BackgroundTranscriptionIndicatorProps> = ({
  hasBackgroundProcessing,
  pendingStages,
  isVisible = true,
}) => {
  if (!isVisible || !hasBackgroundProcessing || pendingStages.length === 0) {
    return null;
  }

  const stageCount = pendingStages.length;
  const stageText = stageCount === 1 
    ? `answer ${pendingStages[0]}` 
    : `${stageCount} answers`;

  return (
    <div className="flex items-center justify-center w-full bg-blue-50 border-b border-blue-100 px-4 py-2">
      <div className="flex items-center gap-3 text-sm text-blue-700">
        {/* Animated processing icon */}
        <div className="relative">
          <svg 
            className="w-4 h-4 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="2"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          
          {/* Pulse dot overlay */}
          <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        </div>

        {/* Status text */}
        <span className="font-medium">
          Processing {stageText} in the background
        </span>

        {/* Optional progress indicator */}
        <div className="flex items-center gap-1">
          {pendingStages.slice(0, 3).map((stage, index) => (
            <div
              key={stage}
              className={`w-2 h-2 rounded-full bg-blue-400 animate-pulse`}
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
          {stageCount > 3 && (
            <span className="text-xs text-blue-600 ml-1">
              +{stageCount - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundTranscriptionIndicator; 
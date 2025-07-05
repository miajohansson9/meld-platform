import React from 'react';
import { Sunset, Loader2 } from 'lucide-react';
import { MorningSegment } from './MorningSegment';
import ReflectionSegment from './ReflectionSegment';
import DailyCompassModule from './DailyCompassModule';
import { useCompassView } from '../../hooks/useCompassView';
import { cn } from '~/utils';

interface TodayModuleProps {
  className?: string;
  date: string;
}

export function TodayModule({ className, date }: TodayModuleProps) {
  const { data: compassData, isLoading, error } = useCompassView(date);
  const currentHour = new Date().getHours();
  const showEveningReflection = currentHour >= 15; // Show after 3 PM
  
  // Check if today's compass is completed
  const today = new Date();
  const todayString = (() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const isToday = date === todayString;
  const todayCompass = Array.isArray(compassData) 
    ? compassData.find(compass => compass.date === date)
    : null;
  const compassCompleted = Boolean(todayCompass && todayCompass.mood !== undefined && todayCompass.energy !== undefined && todayCompass.priority && todayCompass.priorityNote);
  
  // Determine if evening reflection should be prioritized
  const prioritizeEveningReflection = isToday && compassCompleted || showEveningReflection;

  // Handle error state
  if (error) {
    console.error('Error loading compass data:', error);
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn('w-full space-y-8', className)}>
        <div className="w-full min-w-0">
          <MorningSegment date={date} compassData={compassData} isLoading={isLoading} error={error} />
        </div>
      </div>
    );
  }

  const morningSegment = (
    <div className="w-full min-w-0">
      <MorningSegment date={date} compassData={compassData} isLoading={isLoading} error={error} />
    </div>
  );

  const eveningReflectionPreview = (
    <div className="w-full min-w-0">
      <div className="border border-dashed border-meld-graysmoke rounded-lg p-6 bg-meld-graysmoke/20">
        <div className="flex items-center gap-3 mb-4">
          <Sunset className="w-8 h-8 text-meld-ink/60" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-meld-ink">Evening Reflection</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-meld-ink/60 leading-relaxed">
            Opens after 3 PM today.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
            <div className="space-y-2">
              <div className="h-2 bg-meld-graysmoke rounded"></div>
              <div className="h-2 bg-meld-graysmoke rounded w-3/4"></div>
              <div className="text-xs text-meld-ink/50">High of the day</div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-meld-graysmoke rounded"></div>
              <div className="h-2 bg-meld-graysmoke rounded w-2/3"></div>
              <div className="text-xs text-meld-ink/50">Low of the day</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-meld-graysmoke">
            <div className="flex items-center gap-2 text-xs text-meld-ink/50">
              <div className="w-2 h-2 bg-meld-sand/50 rounded-full"></div>
              <span>AI insights will appear here based on your patterns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const eveningReflectionActive = (
    <div className="w-full min-w-0">
      <ReflectionSegment 
        date={date} 
        compassData={compassData || []} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );

  return (
    <div className={cn('w-full space-y-8', className)}>
      {prioritizeEveningReflection ? (
        // When compass is completed and it's after 3 PM, show evening reflection first
        <>
          {eveningReflectionActive}
          {morningSegment}
        </>
      ) : (
        // Default order: morning segment first, then evening reflection
        <>
          {morningSegment}
          {showEveningReflection ? eveningReflectionActive : eveningReflectionPreview}
        </>
      )}
    </div>
  );
}

export default TodayModule;
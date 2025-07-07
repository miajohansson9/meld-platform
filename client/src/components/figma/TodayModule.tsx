import React from 'react';
import { Sunset, Info, Loader2 } from 'lucide-react';
import { MorningSegment } from './MorningSegment';
import ReflectionSegment from './ReflectionSegment';
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
  // Fixed: Only check for mood and energy completion (no priority fields)
  const compassCompleted = Boolean(todayCompass && todayCompass.note !== null && todayCompass.eveningNote !== null && todayCompass.mood !== null && todayCompass.energy !== null);
  
  // Determine if evening reflection should be prioritized
  // For today: prioritize evening if compass is completed
  const prioritizeEveningReflection = isToday && Boolean(todayCompass && todayCompass.note !== null && todayCompass.mood !== null && todayCompass.energy !== null);;

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
    <div className={cn('w-full space-y-8 pb-8', className)}>
      {/* Info Box */}
      {isToday && !todayCompass?.dailySummary && <div className="bg-meld-frost border border-meld-frost rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-meld-ink/20 mt-0.5 flex-shrink-0" strokeWidth={2} />
          <p className="text-sm text-meld-ink leading-relaxed">
            Every check-in gives MELD more context to make your weekly insights more personal and useful.
          </p>
        </div>
      </div>}

      {/* Daily Summary */}
      {isToday && todayCompass?.dailySummary && (
        <div className="bg-meld-sage/10 border border-meld-sage rounded-lg p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-meld-sage">Your Day</h3>
            <p className="text-sm text-meld-ink leading-relaxed">
              {todayCompass.dailySummary}
            </p>
          </div>
        </div>
      )}

      {/* Daily Summary Loading State */}
      {isToday && compassCompleted && !todayCompass?.dailySummary && (
        <div className="bg-meld-sage/10 border border-meld-sage/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-meld-sage" />
            <p className="text-sm text-meld-sage">
              Generating daily summary...
            </p>
          </div>
        </div>
      )}

      {prioritizeEveningReflection ? (
        // When compass is completed AND it's today, show evening reflection first
        // This puts the next actionable item (evening reflection) at the top
        <>
          {showEveningReflection ? eveningReflectionActive : eveningReflectionPreview}
          {morningSegment}
        </>
      ) : (
        // Default order: morning segment first, then evening reflection (preview or active)
        <>
          {morningSegment}
          {showEveningReflection ? eveningReflectionActive : eveningReflectionPreview}
        </>
      )}
    </div>
  );
}

export default TodayModule;
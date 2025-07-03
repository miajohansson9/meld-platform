import React from 'react';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { MorningSegment } from './MorningSegment';
import { ReflectionSegment } from './ReflectionSegment';
import { cn } from '~/utils';

interface TodayModuleProps {
  className?: string;
}

export function TodayModule({ className }: TodayModuleProps) {
  const currentHour = new Date().getHours();
  const showEveningPreview = currentHour < 15;

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Welcome State - could be shown on first visit */}
      {false && (
        <div className="text-center py-16">
          <h1 className="font-serif text-4xl text-meld-ink mb-4">
            Welcome to Your Day
          </h1>
          <div className="w-32 h-32 mx-auto mb-8 relative">
            {/* Animated dotted map - simplified for now */}
            <div className="w-full h-full border-2 border-dashed border-meld-sand/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 border border-dashed border-meld-sand/60 rounded-full animate-pulse delay-300"></div>
            <div className="absolute inset-8 border border-dashed border-meld-sand/80 rounded-full animate-pulse delay-700"></div>
          </div>
          <p className="text-meld-ink/70 max-w-md mx-auto">
            Begin your day with intention. Reflect with purpose. 
            Let insights guide your path forward.
          </p>
        </div>
      )}

      {/* Morning Segment - with responsive width */}
      <div className="w-full min-w-0">
        <MorningSegment />
      </div>

      {/* Evening Reflection - either preview or actual component */}
      <div className="w-full min-w-0">
        {showEveningPreview ? (
          // Preview stub when before 3 PM
          <div className="border border-dashed border-meld-graysmoke rounded-lg p-6 bg-meld-graysmoke/20">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-meld-ink/60" strokeWidth={1.5} />
              <h3 className="font-medium text-meld-ink/70">Evening Reflection</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-meld-ink/60 leading-relaxed">
                Returns after 3 PM to capture your day's highs, lows, and insights.
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
        ) : (
          // Actual reflection component after 3 PM
          <ReflectionSegment />
        )}
      </div>

      {/* Success State - shown after completing reflection */}
      {false && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-meld-sage mb-4">
            {/* Simple confetti effect - 4 particles */}
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-2 h-2 bg-meld-sand rounded-full animate-bounce delay-0"></div>
              <div className="absolute -top-3 right-0 w-1.5 h-1.5 bg-meld-sage rounded-full animate-bounce delay-200"></div>
              <div className="absolute -top-1 -right-3 w-2 h-2 bg-meld-ember rounded-full animate-bounce delay-400"></div>
              <div className="absolute -top-4 left-2 w-1 h-1 bg-meld-frost rounded-full animate-bounce delay-600"></div>
              <span className="text-2xl">✨</span>
            </div>
          </div>
          <p className="font-serif text-lg text-meld-ink">
            Reflection saved. Insight accrues.
          </p>
        </div>
      )}
    </div>
  );
}

export default TodayModule;
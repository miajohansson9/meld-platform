import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '~/utils';
import { useCreateInteraction, useUpdateInteraction, useInteraction } from '~/hooks/useInteractions';
import { useGenerateDailySummary } from '~/hooks/useDailySummary';
import { dataService } from 'librechat-data-provider';
import {
  Sunset,
  CheckCircle,
  Flame,
  Coffee,
  Loader2,
} from 'lucide-react';
import { CompassView } from '../../data-provider/Views';

// Utility to calculate streak count
const getStreakCount = (compassData: CompassView[]): number => {
  if (!compassData || compassData.length === 0) return 0;

  // Sort by date descending
  const sortedData = [...compassData]
    .filter(c => c.completion !== undefined || (c.mood !== undefined && c.energy !== undefined))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sortedData.length; i++) {
    const dataDate = new Date(sortedData[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    // Check if this date matches the expected consecutive date
    if (dataDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

interface ReflectionSegmentProps {
  date: string;
  compassData: CompassView[];
  isLoading?: boolean;
  error?: unknown;
  className?: string;
}

// Inline nudge component for low energy days
const InlineNudge: React.FC<{
  icon: React.ComponentType<any>;
  text: string;
  onClick: () => void;
}> = ({ icon: Icon, text, onClick }) => (
  <div className="bg-meld-sand/10 rounded-lg p-3 border border-meld-sand/20 mb-4">
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-meld-ink/70 hover:text-meld-ink text-sm transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </button>
  </div>
);

const ReflectionSegment: React.FC<ReflectionSegmentProps> = ({
  date,
  compassData,
  isLoading,
  error,
  className,
}) => {
  const navigate = useNavigate();
  const createInteractionMutation = useCreateInteraction();
  const updateInteractionMutation = useUpdateInteraction();
  const { mutate: generateDailySummary } = useGenerateDailySummary();

  // State - Simplified for new flow
  const [genQuestion, setGenQuestion] = useState<string>('');
  const [genSummary, setGenSummary] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [showReflectionScreen, setShowReflectionScreen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingInteractionId, setExistingInteractionId] = useState<string | null>(null);

  // Get current compass data
  const currentCompass = compassData?.find(c => c.date === date);

  // Fetch existing interaction data when editing
  console.log(existingInteractionId, isEditing);
  const { data: existingInteraction } = useInteraction(
    (existingInteractionId && isEditing) ? existingInteractionId : ''
  );

  // Check if today
  const today = new Date();
  const todayString = (() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const isToday = date === todayString;

  // Calculate streak count from compass data
  const streakCount = getStreakCount(compassData);

  // Hydrate from existing data
  useEffect(() => {
    if (currentCompass) {
      setReflection(currentCompass.eveningNote || '');
      if (currentCompass.reflectionInteractionId) {
        setExistingInteractionId(currentCompass.reflectionInteractionId);
      }
    }
  }, [currentCompass]);

  // Populate question and summary from existing interaction when editing
  useEffect(() => {
    if (existingInteraction && isEditing) {
      const meta = existingInteraction.interactionMeta;
      if (meta?.generatedQuestion) {
        setGenQuestion(meta.generatedQuestion);
      }
      if (meta?.generatedSummary) {
        setGenSummary(meta.generatedSummary);
      }
    }
  }, [existingInteraction, isEditing]);

  const handleEditReflection = () => {
    // Enter edit mode and populate with existing data
    setIsEditing(true);
    setIsCompleted(false);

    if (currentCompass) {
      setReflection(currentCompass.eveningNote || '');
      // If there's existing reflection, start on reflection screen
      if (currentCompass.eveningNote) {
        setShowReflectionScreen(true);
      } else {
        setShowReflectionScreen(false);
      }
    }
  };

  const handleBeginReflection = async () => {
    // Generate question first if not already generated
    if (!genQuestion && !generating) {
      setGenerating(true);
      try {
        const response = await dataService.generateReflectionQuestion({
          date
        });

        setGenSummary(response.summary || '');
        setGenQuestion(response.question || '');
      } catch (error: any) {
        console.error('Failed to generate question:', error);
        if (error.response?.status === 429) {
          toast.error('Too many requests. Try again in a minute.');
        } else {
          toast.error('Couldn\'t generate a question, try again in a minute.');
        }
        setGenerating(false);
        return; // Don't proceed to reflection screen if question generation failed
      } finally {
        setGenerating(false);
      }
    }

    setShowReflectionScreen(true);
    // Focus on textarea after a brief delay
    setTimeout(() => {
      const textarea = document.querySelector('[data-reflection-textarea]') as HTMLTextAreaElement;
      textarea?.focus();
    }, 100);
  };

  const handleBackToOverview = () => {
    setShowReflectionScreen(false);
    setIsEditing(false);
  };

  // Validation and save - Updated for new flow
  const handleComplete = async () => {
    if (!reflection.trim()) {
      toast.error('Add your reflection to continue.');
      return;
    }

    setSaving(true);
    try {
      if (existingInteractionId && isEditing) {
        // Update existing interaction
        await updateInteractionMutation.mutateAsync({
          id: existingInteractionId,
          data: {
            kind: 'reflection' as const,
            promptText: genQuestion || 'Evening reflection',
            responseText: reflection,
            interactionMeta: {
              type: 'reflection',
              generatedQuestion: genQuestion || null,
              generatedSummary: genSummary || null,
            }
          }
        });
      } else {
        // Create new interaction
        await createInteractionMutation.mutateAsync({
          kind: 'reflection' as const,
          promptText: genQuestion || 'Evening reflection',
          responseText: reflection,
          interactionMeta: {
            type: 'reflection',
            generatedQuestion: genQuestion || null,
            generatedSummary: genSummary || null,
          }
        });
      }

      // Mark as completed
      setIsCompleted(true);
      setIsEditing(false);

      toast.success('Evening reflection saved — insights will help shape your growth.', {
        duration: 3000,
        position: 'bottom-center'
      });

      // Generate daily summary after saving reflection
      generateDailySummary({
        date,
        eveningReflectionText: reflection
      });

    } catch (error) {
      console.error('Failed to save reflection:', error);
      toast.error('Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  // Handle error state
  if (error) {
    console.error('Error loading compass data:', error);
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Evening Check-In</h2>
          </div>
          <div className="flex items-center gap-3 text-meld-ink/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading reflection data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show no data message for previous days
  if (!isToday && !currentCompass) {
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Evening Check-In</h2>
          </div>
          <p className="text-sm text-meld-ink/50">
            No reflection data available for {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}.
          </p>
        </div>
      </div>
    );
  }

  // Determine if form should be disabled (submitted state)
  const isSubmitted = currentCompass && !isToday;
  const isReflectionComplete = currentCompass && currentCompass.eveningNote;
  const isDisabled = Boolean(isSubmitted) || saving || isCompleted || (Boolean(isReflectionComplete) && !isEditing);

  // Show summary view when reflection is completed
  const shouldShowSummary = (isCompleted || isReflectionComplete) && !isEditing && !showReflectionScreen;

  if (shouldShowSummary) {
    // Use current state data if we just completed, otherwise use database data
    const displayReflection = isCompleted ? reflection : (currentCompass?.eveningNote || '');

    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <Sunset className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
              <h2 className="font-serif text-xl text-meld-ink">Evening Check-In</h2>
              {/* Streak badge */}
              {streakCount >= 3 && (
                <div className="bg-meld-sage text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{streakCount}-day streak</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-meld-sage text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                Completed
              </div>
              {isToday && (
                <button
                  onClick={handleEditReflection}
                  className="text-meld-ink/60 hover:text-meld-ink text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-meld-sage font-medium">
            <CheckCircle className="w-4 h-4" strokeWidth={2} />
            <span>
              {isToday ? "Great job! Your evening reflection is complete." : "Evening reflection completed for this day."}
            </span>
          </div>
        </div>

        {/* Summary Data */}
        <div className="p-6 lg:p-8 space-y-6 bg-meld-graysmoke/10">
          {/* Evening Reflection */}
          {displayReflection && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-meld-ink">Evening Reflection:</h4>
              <div className="bg-white rounded-lg p-4 border border-meld-ink/10">
                <p className="text-sm text-meld-ink leading-relaxed">
                  {displayReflection}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border border-meld-ink/20 overflow-hidden",
      isDisabled && "opacity-60",
      className
    )} data-component="reflection-segment">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-meld-ink/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink" tabIndex={0}>Evening Check-In</h2>
            {/* Streak badge */}
            {streakCount >= 3 && (
              <div className="bg-meld-sage text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{streakCount}-day streak</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-meld-ink/70 leading-relaxed">
          One quick question to close your day with intention.
        </p>
      </div>

      {/* Interactive Content */}
      <div className="transition-all duration-300 ease-in-out">
        {showReflectionScreen ? (
          // Phase 2: Main Reflection Full-Screen
          <div className="min-h-[60vh] flex flex-col animate-fade-in">
            <div className="flex-1 p-8 lg:p-12 space-y-8">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                {genSummary && (
                  <p className="text-lg text-meld-ink/70 italic leading-relaxed">
                    {genSummary}
                  </p>
                )}

                {
                  genQuestion ? (
                    <h3 className="text-2xl font-serif text-meld-ink leading-relaxed">
                      {genQuestion}
                    </h3>
                  ) : (
                    <h3 className="text-2xl font-serif text-meld-ink leading-relaxed">
                      How did the day unfold?
                    </h3>
                  )
                }
              </div>

              <div className="max-w-3xl mx-auto">
                <textarea
                  data-reflection-textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Jot down your day here..."
                  className="w-full p-6 border-0 bg-transparent resize-none focus:outline-none text-meld-ink placeholder-meld-ink/40 text-base leading-relaxed min-h-[300px] font-serif"
                  disabled={saving}
                  autoFocus
                />
              </div>

              {reflection.length > 20 && (
                <div className="text-center fade-in">
                  <p className="text-sm text-meld-sage/80 italic">
                    You're doing great.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-meld-ink/10 p-6 lg:p-8 flex items-center justify-between bg-meld-graysmoke/20">
              <button
                onClick={handleBackToOverview}
                className="text-meld-ink/60 hover:text-meld-ink text-sm font-medium transition-colors"
                disabled={saving}
              >
                ← Back
              </button>

              <div className="flex items-center gap-4">
                <button
                  className="px-6 py-2 bg-meld-sage text-white rounded-lg hover:bg-meld-sage/90 font-medium transition-colors text-sm"
                  onClick={handleComplete}
                  disabled={saving || !reflection.trim()}
                >
                  Save & finish
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Phase 1: Overview with Begin Reflection button
          <div className="p-6 lg:p-8 space-y-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-serif text-meld-ink">
                  Ready to wrap up today?
                </h3>
                <p className="text-sm text-meld-ink/70 leading-relaxed max-w-md mx-auto">
                  Let's see how your intentions played out—take 30 seconds to jot it down.
                </p>
              </div>

              <button
                onClick={handleBeginReflection}
                className="px-6 py-2 bg-meld-sage text-white rounded-lg hover:bg-meld-sage/90 font-medium transition-colors text-sm"
                disabled={isDisabled || generating}
              >
                {generating ? (
                  <div className="flex flex-row">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Preparing question...
                  </div>
                ) : (
                  'Start'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Low energy nudge */}
        {currentCompass?.energy && currentCompass.energy < 40 && !showReflectionScreen && (
          <InlineNudge
            icon={Coffee}
            text="Low-energy day? Even brief reflections help you learn and grow."
            onClick={() => navigate('/mentor-feed?nudge=recharge')}
          />
        )}
      </div>
    </div>
  );
};

export default ReflectionSegment;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '~/utils';
import { useCreateInteraction } from '~/hooks/useInteractions';
import { dataService } from 'librechat-data-provider';
import {
  Sunset,
  CheckCircle,
  Target,
  Users,
  BookOpen,
  ListChecks,
  HeartPulse,
  Handshake,
  PenTool,
  Bed,
  Brain,
  Flame,
  Coffee,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { CompassView } from '../../data-provider/Views';
import { EMOTIONAL_STATES_ARRAY, EmotionalState } from '../../common';

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

// Priority options from MorningSegment with Lucide icons
const priorityOptions = [
  { value: 'deepWork', label: 'Deep Work', Icon: Target },
  { value: 'collaboration', label: 'Collaboration', Icon: Users },
  { value: 'learning', label: 'Learning', Icon: BookOpen },
  { value: 'admin', label: 'Admin', Icon: ListChecks },
  { value: 'wellbeing', label: 'Well-being', Icon: HeartPulse },
  { value: 'relationships', label: 'Relationships', Icon: Handshake },
  { value: 'creative', label: 'Creative Play', Icon: PenTool },
  { value: 'rest', label: 'Rest / Reset', Icon: Bed },
  { value: 'mindset', label: 'Mindset Shift', Icon: Brain },
];

// Emotional states are now imported from shared constants

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
  const { mutate: createInteraction } = useCreateInteraction();

  // State - Updated for single emotional state selection with auto-generation
  const [selectedState, setSelectedState] = useState<EmotionalState | null>(null);
  const [customEmotion, setCustomEmotion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [genQuestion, setGenQuestion] = useState<string>('');
  const [genPrompt, setGenPrompt] = useState<string>('');
  const [improvementNote, setImprovementNote] = useState('');
  const [deeperNote, setDeeperNote] = useState('');
  const [showDeeperPrompt, setShowDeeperPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Get current compass data
  const currentCompass = compassData?.find(c => c.date === date);

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
      setImprovementNote(currentCompass.improvementNote || '');
    }
  }, [currentCompass]);
  // Check if morning goal text should be truncated
  const shouldTruncateGoal = (text: string) => {
    return text && text.length > 80;
  };

  // Handle "Other" selection
  const handleOtherSelect = () => {
    if (isDisabled || generating) return;

    setSelectedState(null);
    setShowCustomInput(true);
    setGenQuestion('');
    setGenPrompt('');
    setImprovementNote('');
    setDeeperNote('');
    setShowDeeperPrompt(false);
  };

  // Handle emotional state selection with auto-generation
  const handleStateSelect = async (state: EmotionalState) => {
    if (isDisabled || generating) return;

    setSelectedState(state);
    setShowCustomInput(false);
    setCustomEmotion('');
    setGenQuestion('');
    setGenPrompt('');
    setImprovementNote('');
    setDeeperNote('');
    setShowDeeperPrompt(false);

    // Auto-generate question
    setGenerating(true);
    try {
      const response = await dataService.generateReflectionQuestion({
        date,
        intention: currentCompass?.priorityNote || '',
        topics: [state] // We'll update the backend to handle emotional states
      });

      setGenQuestion(response.question || '');
      setGenPrompt(response.prompt || '');

      // Focus on textarea after a brief delay to let the question render
      setTimeout(() => {
        const textarea = document.querySelector('[data-reflection-textarea]') as HTMLTextAreaElement;
        textarea?.focus();
      }, 100);

    } catch (error: any) {
      console.error('Failed to generate question:', error);
      if (error.response?.status === 429) {
        toast.error('Too many requests. Try again in a minute.');
      } else {
        toast.error('Couldn\'t generate a question, try again in a minute.');
      }
      // Reset selection on error
      setSelectedState(null);
    } finally {
      setGenerating(false);
    }
  };

  // Handle custom emotion submission
  const handleCustomEmotionSubmit = async () => {
    if (!customEmotion.trim() || isDisabled || generating) return;

    setGenerating(true);
    try {
      const response = await dataService.generateReflectionQuestion({
        date,
        intention: currentCompass?.priorityNote || '',
        topics: [customEmotion.trim()]
      });

      setGenQuestion(response.question || '');
      setGenPrompt(response.prompt || '');

      // Focus on textarea after a brief delay
      setTimeout(() => {
        const textarea = document.querySelector('[data-reflection-textarea]') as HTMLTextAreaElement;
        textarea?.focus();
      }, 100);

    } catch (error: any) {
      console.error('Failed to generate question:', error);
      if (error.response?.status === 429) {
        toast.error('Too many requests. Try again in a minute.');
      } else {
        toast.error('Couldn\'t generate a question, try again in a minute.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Get truncated goal text
  const getTruncatedGoal = (text: string) => {
    if (!text) return '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // Validation and save - Updated to match MorningSegment pattern
  const handleComplete = async () => {
    if (!selectedState && !customEmotion.trim()) {
      toast.error('Select how your day felt to continue.');
      return;
    }

    if (!improvementNote.trim()) {
      toast.error('Add your reflection to continue.');
      return;
    }

    setSaving(true);
    try {
      // Combine main reflection and deeper reflection if provided
      const fullReflection = deeperNote.trim()
        ? `${improvementNote}\n\n--- Deeper Reflection ---\n${deeperNote}`
        : improvementNote;

      await new Promise((resolve, reject) => {
        createInteraction({
          kind: 'reflection' as const,
          promptText: genQuestion || 'Evening reflection',
          responseText: fullReflection,
          interactionMeta: {
            type: 'evening-reflection',
            emotionalState: selectedState || customEmotion.trim(),
            generatedQuestion: genQuestion || null,
            generatedPrompt: genPrompt || null,
            hasDeeperReflection: !!deeperNote.trim()
          }
        }, {
          onSuccess: resolve,
          onError: reject
        });
      });

      // Mark as completed
      setIsCompleted(true);

      toast.success('Evening reflection saved — insights will help shape your growth.', {
        duration: 3000,
        position: 'bottom-center'
      });

    } catch (error) {
      console.error('Failed to save reflection:', error);
      toast.error('Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    toast.success('Reflection skipped for today.', {
      duration: 2000,
      position: 'bottom-center'
    });
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
            <h2 className="font-serif text-xl text-meld-ink">Evening Reflection</h2>
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
            <h2 className="font-serif text-xl text-meld-ink">Evening Reflection</h2>
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
  const isReflectionComplete = currentCompass && currentCompass.improvementNote;
  const isDisabled = Boolean(isSubmitted) || saving || isCompleted || Boolean(isReflectionComplete);

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
            <h2 className="font-serif text-xl text-meld-ink" tabIndex={0}>Evening Reflection</h2>
            {/* Streak badge */}
            {streakCount >= 3 && (
              <div className="bg-meld-sage text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{streakCount}-day streak</span>
              </div>
            )}
          </div>
          {isCompleted && (
            <div className="bg-meld-sage text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-3 h-3" strokeWidth={2} />
              Completed
            </div>
          )}
        </div>
        {isCompleted ? (
          <div className="flex items-center gap-2 text-sm text-meld-sage font-medium">
            <CheckCircle className="w-4 h-4" strokeWidth={2} />
            <span>Great job! Your reflection is complete.</span>
          </div>
        ) : (
          <p className="text-sm text-meld-ink/70 leading-relaxed">
            How did today feel? Select what resonates most.
          </p>
        )}
      </div>

      <div className="p-6 lg:p-8 space-y-8">
        {/* Emotional State Selection */}
        {!isCompleted && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-meld-ink block">
              How did today feel?
            </label>
            <div className="flex flex-wrap gap-3">
              {EMOTIONAL_STATES_ARRAY.filter(state => state.value !== 'other').map((state) => (
                <button
                  key={state.value}
                  onClick={() => handleStateSelect(state.value)}
                  disabled={isDisabled || generating}
                  className={cn(
                    'flex flex-col items-start gap-1 px-4 py-3 rounded-lg text-sm transition-all duration-200 text-left',
                    selectedState === state.value
                      ? 'bg-meld-sage text-white shadow-sm'
                      : 'bg-meld-sage/5 text-meld-ink/70 hover:bg-meld-sage/10 border border-meld-graysmoke/30',
                    isDisabled || generating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">{state.label}</span>
                    {generating && selectedState === state.value && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs leading-relaxed",
                    selectedState === state.value ? "text-white/90" : "text-meld-ink/50"
                  )}>
                    {state.description}
                  </span>
                </button>
              ))}
              {/* Other option */}
              <button
                onClick={handleOtherSelect}
                disabled={isDisabled || generating}
                className={cn(
                  'flex flex-col items-start gap-1 px-4 py-3 rounded-lg text-sm transition-all duration-200 text-left',
                  selectedState === 'other'
                    ? 'bg-meld-sage text-white shadow-sm'
                    : 'bg-meld-sage/5 text-meld-ink/70 hover:bg-meld-sage/10 border border-meld-graysmoke/30',
                  isDisabled || generating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                )}
              >
                <span className="font-medium">Other</span>
                <span className={cn(
                  "text-xs leading-relaxed",
                  selectedState === "other" ? "text-white/90" : "text-meld-ink/50"
                )}>
                  Something else entirely
                </span>
              </button>
            </div>

            {/* Custom Input Section */}
            {showCustomInput && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <label className="text-sm font-medium text-meld-ink block">
                  Describe how your day felt:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customEmotion}
                    onChange={(e) => setCustomEmotion(e.target.value)}
                    placeholder="e.g., nostalgic, determined, curious..."
                    className="flex-1 p-3 border border-meld-graysmoke rounded-lg focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage bg-white text-meld-ink placeholder-meld-ink/40 text-sm"
                    disabled={isDisabled || generating}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCustomEmotionSubmit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCustomEmotionSubmit}
                    disabled={!customEmotion.trim() || isDisabled || generating}
                    className="px-4 py-3 bg-meld-sage text-white rounded-lg hover:bg-meld-sage/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}

            {generating && !showCustomInput && (
              <div className="flex items-center justify-center gap-2 text-meld-sage text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating personalized reflection question...</span>
              </div>
            )}
          </div>
        )}

        {/* Generated Question & Reflection */}
        {(genQuestion || isCompleted) && (
          <div className="space-y-4">
            {genQuestion && <p>{genQuestion}</p>}
            <div className="space-y-4">
              <textarea
                data-reflection-textarea
                value={improvementNote}
                onChange={(e) => !isDisabled && setImprovementNote(e.target.value)}
                disabled={isDisabled}
                placeholder={"Reflect on your day here..."}
                className="w-full p-4 border border-meld-graysmoke rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage bg-white text-meld-ink placeholder-meld-ink/40 text-sm leading-relaxed min-h-[120px]"
                rows={4}
              />
            </div>

            {/* Deeper Reflection Section - Optional */}
            {genPrompt && !isCompleted && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowDeeperPrompt(!showDeeperPrompt)}
                  className="flex items-center gap-2 text-meld-sage hover:text-meld-sage/80 text-sm font-medium transition-colors"
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showDeeperPrompt && "rotate-180"
                  )} />
                  Show deeper journaling question
                </button>

                {showDeeperPrompt && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-meld-sage/5 rounded-lg p-4 border border-meld-sage/20">
                      <h4 className="font-medium text-meld-ink text-sm leading-relaxed">
                        {genPrompt}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-meld-ink/70 block">
                        Deeper Reflection (Optional)
                      </label>
                      <textarea
                        value={deeperNote}
                        onChange={(e) => !isDisabled && setDeeperNote(e.target.value)}
                        disabled={isDisabled}
                        placeholder="Take a moment to explore this further..."
                        className="w-full p-4 border border-meld-graysmoke rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage bg-white text-meld-ink placeholder-meld-ink/40 text-sm leading-relaxed min-h-[100px]"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Low energy nudge */}
        {currentCompass?.energy && currentCompass.energy < 40 && (
          <InlineNudge
            icon={Coffee}
            text="Low-energy day? Even brief reflections help you learn and grow."
            onClick={() => navigate('/mentor-feed?nudge=recharge')}
          />
        )}
      </div>

      {/* Bottom Section - Only show if not completed */}
      {!isCompleted && (
        <div className="meld-bottom-section px-6 lg:px-8 pb-6 lg:pb-8">
          <button
            className="meld-not-ready-link"
            onClick={handleSkip}
            disabled={saving}
            tabIndex={-1}
            title="You can add a reflection any time tonight."
          >
            Skip for now
          </button>
          <button
            onClick={handleComplete}
            className="meld-complete-button"
            disabled={isDisabled || !improvementNote.trim() || (!selectedState && !customEmotion.trim())}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Reflection'
            )}
          </button>
        </div>
      )}

      {/* Insight teaser - fade in after save */}
      {isCompleted && (
        <div className="px-6 lg:px-8 pb-6 lg:pb-8 animate-in fade-in duration-500">
          <div className="bg-meld-sage/10 rounded-lg p-4 border border-meld-sage/20">
            <button
              onClick={() => navigate('/mentor-feed')}
              className="text-meld-sage hover:text-meld-sage/80 font-medium text-sm transition-colors"
            >
              See how today moves your North-Star →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflectionSegment;
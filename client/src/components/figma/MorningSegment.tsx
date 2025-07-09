import React, { useState, useEffect } from 'react';
import { Target, Frown, Meh, Smile, Laugh, Sparkles, Moon, Coffee, Focus, Zap, Flame, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Slider } from '../ui/Slider';
import { toast } from 'sonner';
import { cn } from '~/utils';
import { CompassView } from '../../data-provider/Views';
import { useCreateInteraction, useUpdateInteraction, useCompassInteractionsForDate } from '../../hooks/useInteractions';

interface MorningSegmentProps {
  className?: string;
  date?: string;
  compassData?: CompassView[];
  isLoading?: boolean;
  error?: any;
}

export function MorningSegment({ className, date, compassData, isLoading, error }: MorningSegmentProps) {
  // Use today's date if no date is provided
  const today = new Date();
  const todayString = (() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const currentDate = date || todayString;
  
  // Check if the selected date is today
  const isToday = currentDate === todayString;
  
  // Check if it's past 3pm today
  const isPast3PM = isToday && today.getHours() >= 15;
  
  // Get the compass data for the selected date
  const currentCompass = Array.isArray(compassData)
    ? compassData.find(compass => compass.date === currentDate)
    : null;

  // Determine if compass is complete
  const isCompassComplete = currentCompass && currentCompass.mood !== undefined && currentCompass.energy !== undefined;

  // If it's today, past 3pm, and no morning entry, show no data message
  if (isToday && isPast3PM && !isCompassComplete) {
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
          </div>
          <p className="text-sm text-meld-ink/50">
            No morning compass data available for today.
          </p>
        </div>
      </div>
    );
  }

  // State for interactive form
  const [mood, setMood] = useState([currentCompass?.mood || 70]);
  const [energy, setEnergy] = useState([currentCompass?.energy || 60]);
  const [note, setNote] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showJournalingScreen, setShowJournalingScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingInteractionIds, setExistingInteractionIds] = useState<{
    mood?: string;
    energy?: string;
    note?: string;
  }>({});

  const createInteractionMutation = useCreateInteraction();
  const updateInteractionMutation = useUpdateInteraction();

  // Get existing compass interactions for today when editing
  const { data: existingInteractions } = useCompassInteractionsForDate(
    isEditing ? currentDate : ''
  );
  
  // Professional mood icons using Lucide
  const moodIcons = [
    { icon: Frown, color: 'text-meld-ink/40' },
    { icon: Meh, color: 'text-meld-ink/60' },
    { icon: Smile, color: 'text-meld-sage' },
    { icon: Laugh, color: 'text-meld-sage' },
    { icon: Sparkles, color: 'text-meld-sand' }
  ];
  
  // Professional energy scale using Lucide icons
  const energyScale = [
    { icon: Moon, label: 'Drained', description: 'Physically or mentally depleted', color: 'text-meld-ink/40' },
    { icon: Coffee, label: 'Steady', description: 'Awake, calm, baseline focus', color: 'text-meld-ink/60' },
    { icon: Focus, label: 'Focused', description: 'Intent, clear, but not amped', color: 'text-meld-sage' },
    { icon: Zap, label: 'Energised', description: 'High drive, ready to push', color: 'text-meld-sage' },
    { icon: Flame, label: 'Powerful', description: 'Peak momentum, confident, on-fire', color: 'text-meld-sand' }
  ];

  // Helper functions
  const getMoodLabel = (value: number) => {
    if (value >= 85) return 'Wonderful';
    if (value >= 70) return 'Great';
    if (value >= 55) return 'Good';
    if (value >= 40) return 'Okay';
    return 'Low';
  };

  const getEnergyLabel = (value: number) => {
    const scaleIndex = Math.floor((value / 100) * 4);
    const clampedIndex = Math.max(0, Math.min(4, scaleIndex));
    return energyScale[clampedIndex].label;
  };

  // Update state when compass data changes (only for today)
  useEffect(() => {
    if (isToday && currentCompass) {
      setMood([currentCompass.mood || 70]);
      setEnergy([currentCompass.energy || 60]);
      setNote(currentCompass.note || '');
      // If there's existing data, determine which screen to show
      const hasSliderData = currentCompass.mood !== undefined && currentCompass.energy !== undefined;
      const hasNoteData = currentCompass.note;
      setShowJournalingScreen(hasSliderData && !hasNoteData);
    } else if (isToday) {
      // Reset state when no compass data for today
      setMood([70]);
      setEnergy([60]);
      setNote('');
      setShowJournalingScreen(false);
    }
  }, [currentCompass, currentDate, isToday]);

  // Populate existing interaction IDs when editing
  useEffect(() => {
    if (isEditing && existingInteractions) {
      const ids: { mood?: string; energy?: string; note?: string } = {};
      
      existingInteractions.forEach((interaction: any) => {
        const type = interaction.interactionMeta?.type;
        if (type && interaction._id) {
          ids[type as keyof typeof ids] = interaction._id;
        }
      });
      
      setExistingInteractionIds(ids);
    }
  }, [isEditing, existingInteractions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleComplete();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Event handlers
  const handleContinueToJournaling = () => {
    setShowJournalingScreen(true);
  };

  const handleBackToSliders = () => {
    setShowJournalingScreen(false);
    setIsEditing(false);
  };

  const handleEditCompass = () => {
    // Enter edit mode and populate with existing data
    setIsEditing(true);
    setIsCompleted(false);
    // Reset existing interaction IDs - they'll be populated by the useEffect
    setExistingInteractionIds({});
    
    if (currentCompass) {
      setMood([currentCompass.mood || 70]);
      setEnergy([currentCompass.energy || 60]);
      setNote(currentCompass.note || '');
      // If there's a note, start on journaling screen
      if (currentCompass.note) {
        setShowJournalingScreen(true);
      } else {
        setShowJournalingScreen(false);
      }
    }
  };

  const handleComplete = async () => {
    try {
      // Prepare interaction data
      const interactionData = [
        {
          type: 'mood',
          data: {
            kind: 'compass' as const,
            promptText: 'How are you feeling?',
            numericAnswer: mood[0],
            captureMethod: 'slider' as const,
            interactionMeta: { type: 'mood', scale: 'mood-scale' }
          }
        },
        {
          type: 'energy',
          data: {
            kind: 'compass' as const,
            promptText: 'Which best describes your energy?',
            numericAnswer: energy[0],
            captureMethod: 'slider' as const,
            interactionMeta: { type: 'energy', scale: 'energy-scale' }
          }
        }
      ];

      let noteInteractionId = null;

      // Add note interaction if there's content
      if (note.trim()) {
        interactionData.push({
          type: 'note',
          data: {
            kind: 'compass',
            promptText: 'Daily Note',
            responseText: note.trim(),
            captureMethod: 'text',
            interactionMeta: { type: 'note' }
          } as any
        });
      }

      console.log('💾 Saving interactions:', { 
        interactionCount: interactionData.length,
        hasNote: !!note.trim(),
        isEditing
      });

      // Save/update all interactions
      const results = await Promise.all(
        interactionData.map(async ({ type, data }) => {
          const existingId = existingInteractionIds[type as keyof typeof existingInteractionIds];
          
          if (existingId && isEditing) {
            console.log(`🔄 Updating ${type} interaction:`, existingId);
            // Update existing interaction
            return updateInteractionMutation.mutateAsync({ id: existingId, data });
          } else {
            console.log(`➕ Creating new ${type} interaction`);
            // Create new interaction
            return createInteractionMutation.mutateAsync(data);
          }
        })
      );

      console.log('✅ All interactions saved:', results);

      // Get the note interaction ID if it was created/updated
      if (note.trim()) {
        const noteIndex = interactionData.findIndex(item => item.type === 'note');
        if (noteIndex !== -1 && results[noteIndex]?._id) {
          noteInteractionId = results[noteIndex]._id;
          console.log('📝 Note interaction saved with ID:', noteInteractionId);
        } else {
          console.error('❌ Failed to get note interaction ID:', {
            noteIndex,
            result: results[noteIndex],
            resultId: results[noteIndex]?._id
          });
        }
      }

      // Mark as completed
      setIsCompleted(true);
      setIsEditing(false); // Reset editing state
  
    } catch (error) {
      console.error('Error saving compass data:', error);
      toast.error("Failed to save your compass data. Please try again.");
    }
  };

  const handleSkip = () => {
    toast.success("Your next prompt will appear tomorrow morning.", {
      duration: 2000,
      position: 'bottom-center'
    });
  };

  // Handle error state
  if (error) {
    console.error('Error loading compass data:', error);
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
          </div>
          <p className="text-sm text-red-600">Error loading compass data</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
          </div>
          <div className="flex items-center gap-3 text-meld-ink/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading compass data...</span>
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
            <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
          </div>
          <p className="text-sm text-meld-ink/50">
            No compass data available for {new Date(currentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}.
          </p>
        </div>
      </div>
    );
  }

  // Show summary view for previous days WITH data, or for today when completed (unless actively editing or in commitment flow)
  const shouldShowSummary = (!isToday && currentCompass) || 
                           (isToday && !isEditing && (isCompleted || isCompassComplete) && !showJournalingScreen);
  
  // Debug logging
  console.log('🔍 MorningSegment render state:', {
    isToday,
    isEditing,
    isCompleted,
    isCompassComplete,
    showJournalingScreen,
    shouldShowSummary,
  });
  
  if (shouldShowSummary) {
    // Use current state data if we just completed editing, otherwise use database data
    const displayData = isCompleted ? {
      mood: mood[0],
      energy: energy[0],
      note: note
    } : currentCompass;

    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)}>
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-meld-ink/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
              <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-meld-sage text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                Completed
              </div>
              {isToday && (
                <button 
                  onClick={handleEditCompass}
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
              {isToday ? "Great job! Your compass is set for today." : "Compass completed for this day."}
            </span>
          </div>
        </div>

        {/* Summary Data */}
        <div className="p-6 lg:p-8 space-y-6 bg-meld-graysmoke/10">
          {/* Mood and Energy Summary */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-meld-ink/70">Mood:</span>
              <span className="text-sm font-medium text-meld-ink">
                {getMoodLabel(displayData?.mood || 70)} ({displayData?.mood || 70})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-meld-ink/70">Energy:</span>
              <span className="text-sm font-medium text-meld-ink">
                {getEnergyLabel(displayData?.energy || 60)} ({displayData?.energy || 60})
              </span>
            </div>
          </div>

          {/* Daily Note */}
          {displayData?.note && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-meld-ink">Setting Today's Intention:</h4>
              <div className="bg-white rounded-lg p-4 border border-meld-ink/10">
                <p className="text-sm text-meld-ink leading-relaxed">
                  {displayData.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // INTERACTIVE FORM FOR TODAY ONLY (when not completed)
  const isDisabled = createInteractionMutation.isLoading || isCompleted;

  return (
    <div className={cn(
      "bg-white rounded-xl border border-meld-ink/20 overflow-hidden",
      isDisabled && "opacity-60",
      className
    )} data-component="morning-segment">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-meld-ink/20">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
        </div>
        <p className="text-sm text-meld-ink/70 leading-relaxed">
          {showJournalingScreen 
            ? 'Take a moment to visualize your day ahead.' 
            : 'Orient for today.'
          }
        </p>
      </div>

      {/* Interactive Content */}
      <div className="transition-all duration-300 ease-in-out">
        {showJournalingScreen ? (
          // Phase 2: Full-Screen Journaling
          <div className="min-h-[60vh] flex flex-col animate-fade-in">
            {/* Journaling Content */}
            <div className="flex-1 p-8 lg:p-12 space-y-8">
              {/* Science-backed prompt with generous spacing */}
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <p className="text-sm text-meld-ink/60 leading-relaxed">
                  Studies show that mentally rehearsing your day in the morning boosts focus and follow-through.
                </p>
                <h3 className="text-2xl font-serif text-meld-ink leading-relaxed">
                  With that in mind, what does a great version of today look like for you?
                </h3>
                
                {/* Breathing dot animation */}
                <div className="flex justify-center pt-2">
                  <div className="w-2 h-2 bg-meld-sage/30 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Full-width journaling area */}
              <div className="max-w-3xl mx-auto">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What does today look like?"
                  className="w-full p-6 border-0 bg-transparent resize-none focus:outline-none text-meld-ink placeholder-meld-ink/40 text-base leading-relaxed min-h-[300px] font-serif"
                  disabled={isDisabled}
                  autoFocus
                />
              </div>

              {/* Gentle affirmation after user starts typing */}
              {note.length > 20 && (
                <div className="text-center fade-in">
                  <p className="text-sm text-meld-sage/80 italic">
                    You're doing great.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-meld-ink/10 p-6 lg:p-8 flex items-center justify-between bg-meld-graysmoke/20">
              <button 
                onClick={handleBackToSliders}
                className="text-meld-ink/60 hover:text-meld-ink text-sm font-medium transition-colors"
                disabled={isDisabled}
              >
                ← Back
              </button>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleComplete}
                  className="px-6 py-2 bg-meld-sage text-white rounded-lg hover:bg-meld-sage/90 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled || !note.trim()}
                >
                  {createInteractionMutation.isLoading ? (
                    <div className="flex flex-row">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    'Save & Close'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Phase 1: Mood and Energy Sliders
          <div className="p-6 lg:p-8 space-y-8 meld-animate-in">
            {/* Mood and Energy Sliders - Side by side on larger screens */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
              {/* Mood Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-meld-ink">How are you feeling?</label>
                  <span className="text-sm text-meld-ink/60 font-medium">
                    {getMoodLabel(mood[0])}
                  </span>
                </div>
                
                {/* Icon anchors */}
                <div className="flex justify-between px-1 mb-3">
                  {moodIcons.map((moodIcon, index) => {
                    const IconComponent = moodIcon.icon;
                    return (
                      <IconComponent key={index} className={cn("w-6 h-6", moodIcon.color)} strokeWidth={2} />
                    );
                  })}
                </div>
                
                <Slider
                  value={mood}
                  onValueChange={setMood}
                  max={100}
                  step={5}
                  className="w-full daily-compass-slider"
                  aria-valuetext={`Feeling ${mood[0]}/100: ${getMoodLabel(mood[0])}`}
                  role="slider"
                  disabled={isDisabled}
                />
              </div>

              {/* Energy Slider - Enhanced */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-meld-ink">
                    Which best describes your energy?
                  </label>
                  <span className="text-sm text-meld-ink/60 font-medium">
                    {getEnergyLabel(energy[0])}
                  </span>
                </div>
                
                {/* Energy icon anchors */}
                <div className="flex justify-between px-1 mb-3">
                  {energyScale.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <IconComponent key={index} className={cn("w-6 h-6", item.color)} strokeWidth={2} />
                    );
                  })}
                </div>
                
                <Slider
                  value={energy}
                  onValueChange={setEnergy}
                  max={100}
                  step={5}
                  className="w-full daily-compass-slider"
                  aria-valuetext={`Energy: ${getEnergyLabel(energy[0])}`}
                  role="slider"
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center pt-4">
              <button 
                onClick={handleContinueToJournaling}
                className="px-6 py-2 bg-meld-sage text-white rounded-lg hover:bg-meld-sage/90 font-medium transition-colors text-sm"
                disabled={isDisabled}
              >
                Save & Begin Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MorningSegment;
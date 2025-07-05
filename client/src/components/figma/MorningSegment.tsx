import React, { useState, useEffect } from 'react';
import { Target, Frown, Meh, Smile, Laugh, Sparkles, Moon, Coffee, Focus, Zap, Flame, Loader2, Users, BookOpen, ListChecks, HeartPulse, Handshake, PenTool, Bed, Brain, CheckCircle } from 'lucide-react';
import { Slider } from '../ui/Slider';
import { toast } from 'sonner';
import { cn } from '~/utils';
import { CompassView } from '../../data-provider/Views';
import { useCreateInteraction } from '../../hooks/useInteractions';

type Priority =
  | 'deepWork'
  | 'learning'
  | 'admin'
  | 'wellbeing'
  | 'relationships'
  | 'creative'
  | 'rest'
  | 'collaboration'
  | 'mindset';

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
  
  // Get the compass data for the selected date
  const currentCompass = Array.isArray(compassData)
    ? compassData.find(compass => compass.date === currentDate)
    : null;

  // Priority options configuration
  const priorityOptions: { value: Priority; label: string; Icon: typeof Target }[] = [
    { value: 'deepWork',       label: 'Deep Work',      Icon: Target },
    { value: 'collaboration',  label: 'Collaboration',  Icon: Users },
    { value: 'learning',       label: 'Learning',       Icon: BookOpen },
    { value: 'admin',          label: 'Admin',          Icon: ListChecks },
    { value: 'wellbeing',      label: 'Well-being',     Icon: HeartPulse },
    { value: 'relationships',  label: 'Relationships',  Icon: Handshake },
    { value: 'creative',       label: 'Creative Play',  Icon: PenTool },
    { value: 'rest',           label: 'Rest / Reset',   Icon: Bed },
    { value: 'mindset',        label: 'Mindset Shift',  Icon: Brain },
  ];

  // Dynamic placeholder map
  const placeholderByPriority: Record<Priority, string> = {
    deepWork:      'What concrete output will prove today\'s focus sprint was a win?',
    collaboration: 'Which conversation must finish with a clear decision or next step?',
    learning:      'What new idea or skill will you deliberately practice?',
    admin:         'Which lingering task will you close out and remove from your mental tabs?',
    wellbeing:     'What specific action will leave you physically recharged by tonight?',
    relationships: 'Who will you invest in today, and how will you show up for them?',
    creative:      'What tangible creative thing will you finish for the joy of it?',
    rest:          'What will make today feel restorative when you look back this evening?',
    mindset:       'Which mindset will you practice in every interaction, and how will you know it stuck?'
  };

  const [mood, setMood] = useState([currentCompass?.mood || 70]);
  const [energy, setEnergy] = useState([currentCompass?.energy || 60]);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [priorityNote, setPriorityNote] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const createInteractionMutation = useCreateInteraction();

  // Update state when compass data changes
  useEffect(() => {
    if (currentCompass) {
      setMood([currentCompass.mood || 70]);
      setEnergy([currentCompass.energy || 60]);
      
      // Load priority and priority note from compass data
      if (currentCompass.priority) {
        setPriority(currentCompass.priority as Priority);
      } else {
        setPriority(null);
      }
      
      if (currentCompass.priorityNote) {
        setPriorityNote(currentCompass.priorityNote);
      } else {
        setPriorityNote('');
      }
    } else {
      // Reset state when no compass data
      setMood([70]);
      setEnergy([60]);
      setPriority(null);
      setPriorityNote('');
    }
  }, [currentCompass, currentDate]);

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

  const handleComplete = async () => {
    if (!priority) {
      toast.error("Pick your top priority for today.");
      return;
    }

    if (!priorityNote.trim()) {
      toast.error("Add a quick note about that priority.");
      return;
    }

    try {
      // Create interactions for mood, energy, and priority
      const interactions = [
        {
          kind: 'compass' as const,
          promptText: 'How are you feeling?',
          numericAnswer: mood[0],
          captureMethod: 'slider' as const,
          interactionMeta: { type: 'mood', scale: 'mood-scale' }
        },
        {
          kind: 'compass' as const,
          promptText: 'Which best describes your energy?',
          numericAnswer: energy[0],
          captureMethod: 'slider' as const,
          interactionMeta: { type: 'energy', scale: 'energy-scale' }
        },
        {
          kind: 'compass' as const,
          promptText: 'Top Priority',
          responseText: priority,
          captureMethod: 'text' as const,
          interactionMeta: { type: 'priority', priorityType: priority }
        },
        {
          kind: 'compass' as const,
          promptText: priorityNote ? placeholderByPriority[priority] : 'Priority Note',
          responseText: priorityNote,
          captureMethod: 'text' as const,
          interactionMeta: { type: 'priority-note', priorityType: priority }
        }
      ];

      // Save all interactions
      await Promise.all(
        interactions.map(interaction => 
          createInteractionMutation.mutateAsync(interaction)
        )
      );

      // Mark as completed
      setIsCompleted(true);

      toast.success("Daily Compass saved — you'll see how it shapes your North Star in Log tonight.", {
        duration: 3000,
        position: 'bottom-center'
      });

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

  // Determine if form should be disabled (submitted state)
  const isSubmitted = currentCompass && !isToday;
  const isCompassComplete = currentCompass && currentCompass.mood !== undefined && currentCompass.energy !== undefined && currentCompass.priority && currentCompass.priorityNote;
  const isDisabled = Boolean(isSubmitted) || createInteractionMutation.isLoading || isCompleted || Boolean(isCompassComplete);

  return (
    <div className={cn(
      "bg-white rounded-xl border border-meld-ink/20 overflow-hidden",
      (isDisabled || isCompleted) && "opacity-60",
      className
    )} data-component="morning-segment">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-meld-ink/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
          </div>
          {(isSubmitted || isCompleted || isCompassComplete) && (
            <div className="bg-meld-sage text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-3 h-3" strokeWidth={2} />
              Completed
            </div>
          )}
        </div>
        {(isCompleted || isCompassComplete) ? (
          <div className="flex items-center gap-2 text-sm text-meld-sage font-medium">
            <CheckCircle className="w-4 h-4" strokeWidth={2} />
            <span>Great job! Your compass is set for today.</span>
          </div>
        ) : (
          <p className="text-sm text-meld-ink/70 leading-relaxed">
            Orient for today.
          </p>
        )}
      </div>

      <div className="p-6 lg:p-8 space-y-8">
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

        {/* Priority Selector - Full width */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-meld-ink block">Top Priority</label>
          <div className="flex flex-wrap gap-3">
            {priorityOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => !isDisabled && setPriority(value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  priority === value
                    ? 'bg-meld-sage text-white shadow-sm'
                    : 'bg-meld-graysmoke/40 text-meld-ink/70 hover:bg-meld-graysmoke/60',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
                disabled={isDisabled}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Note - Full width */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-meld-ink block">Priority Note</label>
          <textarea
            value={priorityNote}
            onChange={(e) => setPriorityNote(e.target.value)}
            placeholder={
              priority
                ? placeholderByPriority[priority]
                : 'Pick a priority above to see a tailored prompt…'
            }
            className="w-full p-4 border border-meld-graysmoke rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage bg-white text-meld-ink placeholder-meld-ink/40 text-sm leading-relaxed min-h-[100px]"
            rows={3}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Bottom Section - Only show for today if not completed */}
      {(isToday && !isCompassComplete && !isCompleted) && (
        <div className="meld-bottom-section px-6 lg:px-8 pb-6 lg:pb-8">
          <button className="meld-not-ready-link" onClick={handleSkip}>
            Skip for now
          </button>
          <button 
            onClick={handleComplete}
            className="meld-complete-button"
            disabled={isDisabled}
          >
            {createInteractionMutation.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Complete Check-in'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default MorningSegment;
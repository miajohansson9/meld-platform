import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, Frown, Meh, Smile, Laugh, Sparkles, Moon, Coffee, Focus, Zap, Flame, Star, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Slider } from '../ui/Slider';
import { toast } from 'sonner';
import { cn } from '~/utils';

interface MorningSegmentProps {
  className?: string;
}

export function MorningSegment({ className }: MorningSegmentProps) {
  const [mood, setMood] = useState([70]);
  const [energy, setEnergy] = useState([60]); // Will map to "Focused" (3/5)
  const [focusIntention, setFocusIntention] = useState('');
  const [alignment, setAlignment] = useState<'aligned' | 'realign' | null>(null);
  const [realignReason, setRealignReason] = useState('');
  const [showCharCounter, setShowCharCounter] = useState(false);
  const [showPastSelfSuggestion, setShowPastSelfSuggestion] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [dayCount, setDayCount] = useState(2); // Mock: user's second day
  const focusTextareaRef = useRef<HTMLTextAreaElement>(null);
  const realignTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock yesterday's intention
  const yesterdayIntention = "delegate sprint brief";

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

  // Show character counter after 60 chars
  useEffect(() => {
    setShowCharCounter(focusIntention.length >= 60);
  }, [focusIntention]);

  // Show past-self suggestion on second day
  useEffect(() => {
    if (dayCount > 1 && focusIntention.length > 0 && !showPastSelfSuggestion) {
      const timer = setTimeout(() => {
        setShowPastSelfSuggestion(true);
      }, 2000); // Show after 2 seconds of typing
      return () => clearTimeout(timer);
    }
  }, [focusIntention, dayCount, showPastSelfSuggestion]);

  // Auto-resize textarea
  useEffect(() => {
    if (realignTextareaRef.current) {
      realignTextareaRef.current.style.height = 'auto';
      realignTextareaRef.current.style.height = `${Math.min(realignTextareaRef.current.scrollHeight, 80)}px`;
    }
  }, [realignReason]);

  // Auto-toggle alignment when user types in re-align reason
  useEffect(() => {
    if (realignReason.trim() && alignment !== 'realign') {
      setAlignment('realign');
    }
  }, [realignReason, alignment]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleComplete();
        } else if (e.altKey && e.key === 'a') {
          e.preventDefault();
          setAlignment(alignment === 'aligned' ? 'realign' : 'aligned');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alignment]);

  const getMoodLabel = (value: number) => {
    if (value >= 85) return 'Wonderful';
    if (value >= 70) return 'Great';
    if (value >= 55) return 'Good';
    if (value >= 40) return 'Okay';
    return 'Low';
  };

  const getEnergyLabel = (value: number) => {
    // Map 0-100 to 1-5 scale
    const scaleIndex = Math.floor((value / 100) * 4);
    const clampedIndex = Math.max(0, Math.min(4, scaleIndex));
    return energyScale[clampedIndex].label;
  };

  const getEnergyIcon = (value: number) => {
    const scaleIndex = Math.floor((value / 100) * 4);
    const clampedIndex = Math.max(0, Math.min(4, scaleIndex));
    return energyScale[clampedIndex].icon;
  };

  const handleComplete = () => {
    if (!focusIntention.trim()) {
      toast.error("Please share what will move you forward today.");
      return;
    }

    if (alignment === null) {
      toast.error("Please check your alignment with yesterday's intention.");
      return;
    }

    // Post check-in integration toast
    toast.success("Daily Compass saved — you'll see how it shapes your North Star in Log tonight.", {
      duration: 3000,
      position: 'bottom-center'
    });

    console.log('Morning check-in completed:', {
      mood: mood[0],
      energy: energy[0],
      energyLabel: getEnergyLabel(energy[0]),
      focusIntention,
      alignment,
      realignReason
    });
  };

  const handleUsePastIntention = () => {
    setFocusIntention(yesterdayIntention);
    setAlignment('aligned');
    setShowPastSelfSuggestion(false);
  };

  const handleIgnorePastIntention = () => {
    setShowPastSelfSuggestion(false);
  };

  const handleSkip = () => {
    toast.success("Your next prompt will appear tomorrow morning.", {
      duration: 2000,
      position: 'bottom-center'
    });
  };

  return (
    <div className={cn("bg-white rounded-xl border border-meld-ink/20 overflow-hidden", className)} data-component="morning-segment">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-meld-ink/20">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
        </div>
        <p className="text-sm text-meld-ink/70 leading-relaxed">
          Orient for today.
        </p>
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
              {moodIcons.map((mood, index) => {
                const IconComponent = mood.icon;
                return (
                  <IconComponent key={index} className={cn("w-6 h-6", mood.color)} strokeWidth={2} />
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
            />
          </div>
        </div>

        {/* Focus Intention - Full width */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-meld-ink block">Focus Intention</label>
          <textarea
            value={focusIntention}
            onChange={(e) => setFocusIntention(e.target.value)}
            placeholder="In one sentence, what will move you forward today?"
            className="w-full p-4 border border-meld-graysmoke rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage bg-white text-meld-ink placeholder-meld-ink/40 text-sm leading-relaxed min-h-[100px]"
            rows={3}
          />
          {focusIntention.length > 0 && (
            <div className="text-xs text-meld-ink/50 text-right">
              {focusIntention.length} characters
            </div>
          )}
        </div>

        {/* Alignment - Responsive grid */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-meld-ink block">Alignment</label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAlignment('aligned')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 meld-alignment-chip flex items-center gap-2",
                alignment === 'aligned' 
                  ? 'meld-alignment-chip-active' 
                  : 'meld-alignment-chip-inactive'
              )}
            >
              <Star className="w-3.5 h-3.5" strokeWidth={1.5} />
              Aligned
            </button>
            <button
              onClick={() => setAlignment('realign')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 meld-alignment-chip flex items-center gap-2",
                alignment === 'realign' 
                  ? 'meld-alignment-chip-active' 
                  : 'meld-alignment-chip-inactive'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Re-align
            </button>
          </div>
          
          {alignment === 'realign' && (
            <div className="mt-5">
              <Textarea
                ref={realignTextareaRef}
                placeholder="What's nudging you off-course?"
                value={realignReason}
                onChange={(e) => setRealignReason(e.target.value)}
                className="min-h-[60px] max-h-20 resize-none border-meld-graysmoke focus:border-meld-sage overflow-hidden"
                maxLength={120}
                rows={2}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="meld-bottom-section px-6 lg:px-8 pb-6 lg:pb-8">
        <button className="meld-not-ready-link">
          Skip for now
        </button>
        <button 
          onClick={handleComplete}
          className="meld-complete-button"
        >
          Complete Check-in
        </button>
      </div>
    </div>
  );
}

export default MorningSegment;
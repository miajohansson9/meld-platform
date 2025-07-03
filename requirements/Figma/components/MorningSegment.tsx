import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { cn } from './ui/utils';

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

  // Updated emoji anchors to match the screenshots
  const moodEmojis = ['😞', '😐', '🙂', '😃', '✨']; // From first screenshot
  
  // Updated energy scale to match second screenshot
  const energyScale = [
    { emoji: '💤', label: 'Drained', description: 'Physically or mentally depleted' },
    { emoji: '🤤', label: 'Steady', description: 'Awake, calm, baseline focus' },
    { emoji: '😌', label: 'Focused', description: 'Intent, clear, but not amped' },
    { emoji: '⚡', label: 'Energised', description: 'High drive, ready to push' },
    { emoji: '🔥', label: 'Powerful', description: 'Peak momentum, confident, on-fire' }
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

  const getEnergyEmoji = (value: number) => {
    const scaleIndex = Math.floor((value / 100) * 4);
    const clampedIndex = Math.max(0, Math.min(4, scaleIndex));
    return energyScale[clampedIndex].emoji;
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
    <div className={cn("bg-white rounded-lg border border-meld-graysmoke/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-meld-graysmoke/30">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-meld-sand" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-meld-ink">Daily Compass</h2>
        </div>
        <p className="text-sm text-meld-ink/70 leading-relaxed">
          Orient for today.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Mood Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-meld-ink">How are you feeling?</label>
            <span className="text-sm text-meld-ink/60 font-medium">
              {getMoodLabel(mood[0])}
            </span>
          </div>
          
          {/* Emoji anchors */}
          <div className="flex justify-between px-1 mb-2">
            {moodEmojis.map((emoji, index) => (
              <span key={index} className="meld-emoji-anchors">{emoji}</span>
            ))}
          </div>
          
          <Slider
            value={mood}
            onValueChange={setMood}
            max={100}
            step={5}
            className="w-full meld-slider-enhanced"
            aria-valuetext={`Feeling ${mood[0]}/100: ${getMoodLabel(mood[0])}`}
            role="slider"
          />
        </div>

        {/* Energy Slider - Enhanced */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-meld-ink">
              Which best describes your energy?
            </label>
            <span className="text-sm text-meld-ink/60 font-medium">
              {getEnergyLabel(energy[0])}
            </span>
          </div>
          
          {/* Energy emoji anchors */}
          <div className="flex justify-between px-1 mb-2">
            {energyScale.map((item, index) => (
              <span key={index} className="meld-emoji-anchors">{item.emoji}</span>
            ))}
          </div>
          
          <Slider
            value={energy}
            onValueChange={setEnergy}
            max={100}
            step={20} // 5 distinct levels
            className="w-full meld-slider-enhanced"
            aria-valuetext={`Energy: ${getEnergyLabel(energy[0])}`}
            role="slider"
          />
        </div>

        {/* Focus Intention */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-meld-ink">Focus Intention</label>
          <div className="relative">
            <Textarea
              ref={focusTextareaRef}
              placeholder="In one sentence, what will move you forward today?"
              value={focusIntention}
              onChange={(e) => setFocusIntention(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className={cn(
                "min-h-[80px] resize-none border-meld-graysmoke focus:border-meld-sand transition-all duration-200",
                "focus:shadow-[0_2px_0_0_var(--meld-sand)] focus:border-transparent",
                isInputFocused && "border-transparent shadow-[0_2px_0_0_var(--meld-sand)]"
              )}
              maxLength={140}
            />
            
            {/* Character counter */}
            {showCharCounter && (
              <div className="absolute bottom-2 right-3 text-xs text-meld-ink/40">
                {focusIntention.length}/140
              </div>
            )}
          </div>
          
          {/* Past-self suggestion */}
          {showPastSelfSuggestion && (
            <div className="p-3 bg-meld-sage/10 rounded-lg border-l-2 border-meld-sage">
              <p className="text-sm text-meld-ink/70 mb-2">
                Last Monday you chose '{yesterdayIntention}'—still important?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUsePastIntention}
                  className="border-meld-sage text-meld-sage hover:bg-meld-sage/10 text-xs"
                >
                  Use this
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleIgnorePastIntention}
                  className="text-meld-ink/60 hover:text-meld-ink text-xs"
                >
                  Keep typing
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Alignment Check */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-meld-ink">Alignment</label>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setAlignment('aligned')}
              className={cn(
                "flex items-center gap-2 meld-alignment-chip",
                alignment === 'aligned' 
                  ? "meld-alignment-chip-active" 
                  : "meld-alignment-chip-inactive"
              )}
            >
              🏹 Aligned
            </Button>
            <Button
              size="sm"
              onClick={() => setAlignment('realign')}
              className={cn(
                "flex items-center gap-2 meld-alignment-chip",
                alignment === 'realign' 
                  ? "meld-alignment-chip-active" 
                  : "meld-alignment-chip-inactive"
              )}
            >
              🤔 Re-align
            </Button>
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

        {/* Bottom Section - updated copy and removed keyboard shortcuts */}
        <div className="meld-bottom-section">
          <button 
            onClick={handleSkip}
            className="meld-not-ready-link"
          >
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
    </div>
  );
}
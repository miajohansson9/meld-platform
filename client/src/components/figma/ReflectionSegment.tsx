import React, { useState } from 'react';
import { Sunset, Calendar, Clock, Star, Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Slider } from '../ui/Slider';
import { cn } from '~/utils';

interface ReflectionSegmentProps {
  className?: string;
}

export function ReflectionSegment({ className }: ReflectionSegmentProps) {
  const [isAfternoon] = useState(false); // Mock: will be true after 3 PM
  const [showNarrativeBanner, setShowNarrativeBanner] = useState(true);
  const [highOfDay, setHighOfDay] = useState('');
  const [lowOfDay, setLowOfDay] = useState('');
  const [newInsight, setNewInsight] = useState('');
  const [moodReflection, setMoodReflection] = useState([70]);

  const handleComplete = () => {
    console.log('Evening reflection completed:', {
      highOfDay,
      lowOfDay,
      newInsight,
      moodReflection: moodReflection[0]
    });
  };

  if (!isAfternoon) {
    return (
      <div className={cn("bg-meld-sage/5 rounded-lg border border-gray-200 overflow-hidden", className)}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="w-5 h-5 text-meld-sage" strokeWidth={1.5} />
            <h2 className="font-serif text-xl text-meld-ink">Evening Reflection</h2>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-meld-sage" strokeWidth={1.5} />
            <p className="text-sm text-meld-ink/70 leading-relaxed">
              Opens after 3 PM.
            </p>
          </div>
        </div>

        {/* Structure Preview with sage background */}
        <div className="border-t border-dashed border-meld-sage/20">
          <div className="p-6 space-y-4">
            <div className="space-y-4 opacity-40">
              {/* High of the day */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-meld-ink">High of the day</label>
                <div className="h-8 bg-white/80 rounded border-dashed border border-meld-graysmoke"></div>
              </div>

              {/* Low of the day */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-meld-ink">Low of the day</label>
                <div className="h-8 bg-white/80 rounded border-dashed border border-meld-graysmoke"></div>
              </div>

              {/* New insight */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-meld-ink">Any new insight?</label>
                <div className="h-8 bg-white/80 rounded border-dashed border border-meld-graysmoke"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Compass Teaser */}
        {showNarrativeBanner && (
          <div className="mx-6 mb-6 p-4 bg-meld-sage/10 rounded-lg border border-meld-graysmoke">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-meld-sage font-medium mb-1">
                  Deep dive overdue?
                </p>
                <p className="text-sm text-meld-ink/70">
                  A 5-min Narrative session will update your North Star.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => console.log('Start Narrative Compass')}
                  className="bg-meld-sage hover:bg-meld-sage/90 text-white"
                >
                  Start now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNarrativeBanner(false)}
                  className="text-meld-ink/40 hover:text-meld-ink p-1"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active evening reflection (after 3 PM)
  return (
    <div className={cn("bg-white rounded-lg border border-meld-ink/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-meld-ink/30">
        <div className="flex items-center gap-3 mb-2">
          <Sunset className="w-5 h-5 text-meld-sage" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-meld-ink">Evening Reflection</h2>
        </div>
        <p className="text-sm text-meld-ink/70 leading-relaxed">
          How did your compass guide you today?
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* High of the day */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-meld-ink">High of the day</label>
          <Textarea
            placeholder="What went well? What felt aligned?"
            value={highOfDay}
            onChange={(e) => setHighOfDay(e.target.value)}
            className="min-h-[60px] resize-none border-meld-graysmoke focus:border-meld-sage"
          />
        </div>

        {/* Low of the day */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-meld-ink">Low of the day</label>
          <Textarea
            placeholder="What was challenging? What felt off?"
            value={lowOfDay}
            onChange={(e) => setLowOfDay(e.target.value)}
            className="min-h-[60px] resize-none border-meld-graysmoke focus:border-meld-sage"
          />
        </div>

        {/* New insight */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-meld-ink">Any new insight?</label>
          <Textarea
            placeholder="A thought, connection, or realization worth capturing..."
            value={newInsight}
            onChange={(e) => setNewInsight(e.target.value)}
            className="min-h-[60px] resize-none border-meld-graysmoke focus:border-meld-sage"
          />
        </div>

        {/* Mood reflection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-meld-ink">Overall feeling about today</label>
            <span className="text-sm text-meld-ink/60">
              {moodReflection[0] >= 70 ? 'Fulfilled' : moodReflection[0] >= 40 ? 'Okay' : 'Difficult'}
            </span>
          </div>
          <Slider
            value={moodReflection}
            onValueChange={setMoodReflection}
            max={100}
            step={5}
            className="w-full [&_[role=slider]]:bg-meld-sage [&_[data-orientation=horizontal]]:bg-meld-graysmoke/60"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            className="text-meld-ink/60 hover:text-meld-ink hover:bg-transparent"
          >
            Save for later
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-meld-sage hover:bg-meld-sage/90 text-white"
          >
            Complete Reflection
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReflectionSegment;
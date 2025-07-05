import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Clock, Moon, Coffee, Target } from 'lucide-react';
import { Button } from '../ui/Button';

interface GuidedOverlayProps {
  step: 'checkin' | 'mentor';
  onComplete: (step: string, action?: string) => void;
}

export function GuidedOverlay({ step, onComplete }: GuidedOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsVisible(false);
    // Remove tour parameter from URL
    navigate(window.location.pathname, { replace: true });
  };

  const handleComplete = (action?: string) => {
    onComplete(step, action);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meld-sage/20 rounded-full flex items-center justify-center">
              {step === 'checkin' ? (
                <Clock className="w-5 h-5 text-meld-sage" />
              ) : (
                <Target className="w-5 h-5 text-meld-sage" />
              )}
            </div>
            <h2 className="text-xl font-serif text-meld-ink">
              {step === 'checkin' ? 'Welcome to MELD' : 'Your Strategic Partner'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-meld-ink/40 hover:text-meld-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'checkin' ? (
          <CheckinStep onComplete={handleComplete} />
        ) : (
          <MentorStep onComplete={handleComplete} />
        )}
      </div>
    </div>
  );
}

function CheckinStep({ onComplete }: { onComplete: (action?: string) => void }) {
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 15;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        {isEvening ? (
          <Moon className="w-8 h-8 text-meld-sage" />
        ) : (
          <Coffee className="w-8 h-8 text-meld-sage" />
        )}
        <div>
          <h3 className="font-medium text-meld-ink">
            {isEvening ? 'Wind down and reflect' : 'Set your compass for today'}
          </h3>
          <p className="text-sm text-meld-ink/70">
            {isEvening 
              ? 'Take a moment to log what mattered today'
              : 'Start your day with intention and clarity'
            }
          </p>
        </div>
      </div>

      <div className="bg-meld-sage/10 rounded-xl p-4 border border-meld-sage/20">
        <p className="text-sm text-meld-ink/80 mb-3">
          Your daily check-in is the foundation of your MELD practice. 
          {isEvening 
            ? ' Reflect on your experiences and capture insights.'
            : ' Set your intention and prepare for meaningful progress.'
          }
        </p>
        <div className="flex items-center gap-2 text-xs text-meld-sage">
          <div className="w-2 h-2 bg-meld-sage rounded-full"></div>
          <span>This takes about 2-3 minutes</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onComplete('complete')}
          className="flex-1 bg-meld-sage hover:bg-meld-sage/90 text-white"
        >
          {isEvening ? 'Start Evening Reflection' : 'Begin Daily Check-in'}
        </Button>
        <Button
          onClick={() => onComplete('skip')}
          variant="outline"
          className="px-4 border-meld-graysmoke text-meld-ink/70 hover:text-meld-ink"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

function MentorStep({ onComplete }: { onComplete: (action?: string) => void }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleReflectNow = () => {
    // This would open the chat with a prefilled message
    // For now, we'll just complete the onboarding
    onComplete('reflect');
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleConfirm = () => {
    setShowScheduleModal(false);
    onComplete('schedule');
  };

  if (showScheduleModal) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-medium text-meld-ink mb-2">Block 15 minutes to think big</h3>
          <p className="text-sm text-meld-ink/70">
            Great goals deserve calendar space. Choose a time.
          </p>
        </div>

        <div className="bg-meld-sage/10 rounded-xl p-4 border border-meld-sage/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-meld-ink">Goal Reflection</span>
            <span className="text-xs text-meld-ink/60">Tomorrow, 9:00 AM</span>
          </div>
          <p className="text-xs text-meld-ink/70">
            15-minute session to clarify your biggest 6-month goal
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleScheduleConfirm}
            className="flex-1 bg-meld-sage hover:bg-meld-sage/90 text-white"
          >
            Schedule Session
          </Button>
          <Button
            onClick={() => setShowScheduleModal(false)}
            variant="outline"
            className="px-4 border-meld-graysmoke text-meld-ink/70 hover:text-meld-ink"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medium text-meld-ink mb-2">Let's map your bigger goals</h3>
        <p className="text-sm text-meld-ink/70">
          Daily check-ins are the heartbeat. Now let's sketch where you're headed.
        </p>
      </div>

      <div className="bg-gradient-to-br from-meld-sage/10 to-meld-sand/10 rounded-xl p-4 border border-meld-sage/20">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-meld-sage mt-0.5" />
          <div>
            <h4 className="font-medium text-meld-ink text-sm mb-1">Strategic Thinking Partner</h4>
            <p className="text-xs text-meld-ink/70">
              I'll help you explore your ambitions, clarify your direction, and 
              create a meaningful path forward.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleReflectNow}
          className="flex-1 bg-meld-sage hover:bg-meld-sage/90 text-white"
        >
          Reflect now
        </Button>
        <Button
          onClick={handleSchedule}
          variant="outline"
          className="border-meld-graysmoke text-meld-ink/70 hover:text-meld-ink"
        >
          Schedule for later
        </Button>
      </div>
    </div>
  );
}

export default GuidedOverlay; 
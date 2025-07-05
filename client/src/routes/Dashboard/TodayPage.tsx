import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  TodayModule, 
  CoachFeedModule, 
  HeaderBar,
  GuidedOverlay
} from '~/components/figma';
import { ScrollArea } from '~/components/ui/ScrollArea';

export default function TodayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState<'checkin' | 'mentor'>('checkin');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Use local date to avoid timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tourStep = params.get('tour');
    
    if (tourStep === 'checkin' || tourStep === 'mentor') {
      setOverlayStep(tourStep);
      setShowOverlay(true);
    }
  }, [location.search]);

  const handleOverlayComplete = (step: string, action?: string) => {
    setShowOverlay(false);
    
    if (step === 'checkin') {
      // After checkin, show mentor step
      navigate('/today?tour=mentor', { replace: true });
      setTimeout(() => {
        setOverlayStep('mentor');
        setShowOverlay(true);
      }, 500);
    } else if (step === 'mentor') {
      // Complete onboarding
      navigate('/today', { replace: true });
      
      if (action === 'reflect') {
        // Open chat with prefilled message
        setTimeout(() => {
          navigate('/chats', { replace: true });
          // TODO: Add logic to prefill chat with goal reflection message
        }, 1000);
      }
      
      // Mark first run as complete
      localStorage.setItem('meld_first_run_complete', 'true');
    }
  };

  return (
    <div className="h-full flex flex-col bg-meld-canvas">
      <HeaderBar date={selectedDate} onDateChange={setSelectedDate} showDateNav />
      <div className="flex flex-1 p-8 gap-8 justify-center max-h-full overflow-y-auto">
        {/* Main Today Content - Scrollable with better responsive widths */}
        <div className="flex-1 min-w-0 max-w-5xl">
          <TodayModule date={selectedDate} />
        </div>
        
        {/* Right Sidebar - Sticky Coach Feed */}
        <div className="w-80 xl:w-96 bg-meld-canvas shrink-0">
          <CoachFeedModule variant="preview" maxItems={2} />
        </div>
      </div>

      {/* Guided Overlay for Onboarding */}
      {showOverlay && (
        <GuidedOverlay 
          step={overlayStep} 
          onComplete={handleOverlayComplete}
        />
      )}
    </div>
  );
} 
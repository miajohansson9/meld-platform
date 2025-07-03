import React, { useState } from 'react';
import { Lightbulb, Target, Zap, MoreHorizontal, CheckCircle } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/utils';

interface ContextDockProps {
  className?: string;
}

interface CoachCard {
  id: string;
  type: 'insight' | 'nudge' | 'task-nudge' | 'journal-prompt';
  title: string;
  content: string;
  timestamp: string;
  context?: string;
  isRead: boolean;
}

const mockCards: CoachCard[] = [
  {
    id: '1',
    type: 'insight',
    title: 'Weekly Pattern',
    content: 'You tend to have your best insights on Tuesday afternoons.',
    timestamp: '2 minutes ago',
    context: 'Last month you noted: "Tuesday energy feels different." Want to dig deeper?',
    isRead: false
  },
  {
    id: '2',
    type: 'nudge',
    title: 'Presentation Tomorrow',
    content: 'Your fragment "speak with conviction" might help.',
    timestamp: '10 minutes ago',
    context: '3 weeks ago you wrote: "Speak with conviction." Still resonate?',
    isRead: false
  },
  {
    id: '3',
    type: 'journal-prompt',
    title: 'Alignment Check',
    content: "It's been 3 days since your last North Star review.",
    timestamp: '1 hour ago',
    isRead: true
  }
];

export function ContextDock({ className }: ContextDockProps) {
  const [cards, setCards] = useState<CoachCard[]>(mockCards);
  
  const unreadCount = cards.filter(card => !card.isRead).length;

  const getTypeConfig = (type: CoachCard['type']) => {
    switch (type) {
      case 'insight':
        return {
          icon: Lightbulb,
          color: 'meld-sand',
          bgColor: 'meld-sand/10',
          borderColor: 'meld-sand/20'
        };
      case 'nudge':
      case 'task-nudge':
        return {
          icon: Target,
          color: 'meld-sage',
          bgColor: 'meld-sage/10',
          borderColor: 'meld-sage/20'
        };
      case 'journal-prompt':
        return {
          icon: Zap,
          color: 'meld-rose',
          bgColor: 'meld-rose/10',
          borderColor: 'meld-rose/20'
        };
      default:
        return {
          icon: Lightbulb,
          color: 'meld-sand',
          bgColor: 'meld-sand/10',
          borderColor: 'meld-sand/20'
        };
    }
  };

  const markAsRead = (cardId: string) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isRead: true } : card
    ));
  };

  const markAllAsRead = () => {
    setCards(prev => prev.map(card => ({ ...card, isRead: true })));
  };

  const handleAction = (cardId: string, action: string) => {
    console.log(`Action ${action} for card ${cardId}`);
    markAsRead(cardId);
  };

  return (
    <div className={cn("w-80 bg-white border-l border-meld-graysmoke/50 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-meld-graysmoke/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-lg text-meld-ink">CoachFeed</h3>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-meld-sand rounded-full">
                {unreadCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-meld-ink/60 hover:text-meld-ink h-6 px-2"
              >
                Mark all read
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-meld-ink/70">
          AI-powered contextual insights
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-meld-graysmoke/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-meld-ink/40" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-meld-ink/60">
              No insights right now.
            </p>
            <p className="text-xs text-meld-ink/40 mt-1">
              Check back after your check-in.
            </p>
          </div>
        ) : (
          cards.map((card) => {
            const config = getTypeConfig(card.type);
            const Icon = config.icon;
            
            return (
              <div
                key={card.id}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  `border-${config.borderColor} bg-${config.bgColor}`,
                  !card.isRead && "shadow-sm",
                  card.isRead && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${config.color}/20 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 text-${config.color}`} strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-meld-ink truncate">
                        {card.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {!card.isRead && (
                          <div className="w-2 h-2 bg-meld-sand rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-meld-ink/40 hover:text-meld-ink"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-meld-ink/80 mb-2 leading-relaxed">
                      {card.content}
                    </p>
                    
                    {card.context && (
                      <div className="p-2 bg-white/50 rounded border border-meld-graysmoke/30 mb-3">
                        <p className="text-xs text-meld-ink/70 italic">
                          {card.context}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-meld-ink/50">
                        {card.timestamp}
                      </span>
                      
                      <div className="flex gap-2">
                        {card.type === 'insight' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(card.id, 'explore')}
                            className="h-6 px-2 text-xs text-meld-sage hover:bg-meld-sage/10"
                          >
                            Explore This
                          </Button>
                        )}
                        
                        {card.type === 'nudge' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(card.id, 'align')}
                            className="h-6 px-2 text-xs text-meld-sand hover:bg-meld-sand/10"
                          >
                            Quick Align
                          </Button>
                        )}
                        
                        {card.type === 'task-nudge' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction(card.id, 'done')}
                              className="h-6 px-2 text-xs text-meld-sage hover:bg-meld-sage/10"
                            >
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction(card.id, 'snooze')}
                              className="h-6 px-2 text-xs text-meld-ink/60 hover:bg-meld-graysmoke/30"
                            >
                              Later
                            </Button>
                          </>
                        )}
                        
                        {card.type === 'journal-prompt' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(card.id, 'journal')}
                            className="h-6 px-2 text-xs text-meld-rose hover:bg-meld-rose/10"
                          >
                            Journal
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 
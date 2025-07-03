import React, { useState } from 'react';
import { MessageCircle, MapPin, Clock, ChevronRight, Lightbulb, Bell, Target, CheckCheck, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import Badge from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { cn } from '~/utils';

interface ContextDockProps {
  className?: string;
}

interface CoachFeedCard {
  id: string;
  type: 'reminder' | 'insight' | 'nudge';
  title: string;
  content: string;
  context?: string;
  actionLabel: string;
  timeRelevant?: string;
  isRead?: boolean;
  pastSelfCue?: string;
}

const mockCoachFeedCards: CoachFeedCard[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Presentation Tomorrow',
    content: 'Your fragment "speak with conviction" might help.',
    context: 'Based on your upcoming calendar event',
    actionLabel: 'Quick Align',
    timeRelevant: '10 AM',
    isRead: false,
    pastSelfCue: '3 weeks ago you wrote: "Speak with conviction." Still resonate?'
  },
  {
    id: '2',
    type: 'insight',
    title: 'Weekly Pattern',
    content: 'You tend to have your best insights on Tuesday afternoons.',
    context: 'Pattern from your reflection data',
    actionLabel: 'Explore This',
    isRead: false,
    pastSelfCue: 'Last month you noted: "Tuesday energy feels different." Want to dig deeper?'
  },
  {
    id: '3',
    type: 'nudge',
    title: 'Alignment Check',
    content: 'It\'s been 3 days since your last North Star review.',
    context: 'Maintaining strategic focus',
    actionLabel: 'Quick Review',
    isRead: true,
    pastSelfCue: 'You set a goal: "Check North Star weekly." Time for a gentle revisit?'
  }
];

interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

const mockChatThread: ChatThread = {
  id: '1',
  title: 'Meld AI',
  lastMessage: 'I notice you\'ve been focusing on presentation skills lately. Would you like to...',
  timestamp: '2 min ago',
  unreadCount: 2
};

export function ContextDock({ className }: ContextDockProps) {
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [cards, setCards] = useState(mockCoachFeedCards);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getBadgeVariant = (type: CoachFeedCard['type']) => {
    switch (type) {
      case 'reminder':
        return 'bg-meld-ember/20 text-meld-ember hover:bg-meld-ember/30';
      case 'insight':
        return 'bg-meld-sage/20 text-meld-sage hover:bg-meld-sage/30';
      case 'nudge':
        return 'bg-meld-sand/40 text-meld-ink hover:bg-meld-sand/60';
      default:
        return 'bg-meld-graysmoke text-meld-ink';
    }
  };

  const getTypeIcon = (type: CoachFeedCard['type']) => {
    switch (type) {
      case 'reminder':
        return Bell;
      case 'insight':
        return Lightbulb;
      case 'nudge':
        return Target;
      default:
        return MessageCircle;
    }
  };

  const markAllAsRead = () => {
    setCards(prev => prev.map(card => ({ ...card, isRead: true })));
  };

  const unreadCount = cards.filter(card => !card.isRead).length;

  const renderCoachFeed = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-meld-ink">CoachFeed</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-meld-ink/40 hover:text-meld-ink/60 cursor-help" strokeWidth={1.5} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-48">
                  Nudges are based on your patterns, values and calendar
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-meld-ink/60 hover:text-meld-ink p-1 h-auto"
            >
              <CheckCheck className="w-3 h-3 mr-1" strokeWidth={1.5} />
              Mark all read
            </Button>
          )}
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-meld-ember/20 text-meld-ember text-xs px-2 py-1">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-1">
          {cards.map((card) => {
            const TypeIcon = getTypeIcon(card.type);
            const isHovered = hoveredCard === card.id;
            
            return (
              <div
                key={card.id}
                className={cn(
                  "p-5 bg-white border rounded-lg cursor-pointer group transition-all duration-200 relative",
                  card.isRead ? "border-border opacity-70" : "border-border hover:border-meld-sand/50",
                  isHovered && "shadow-lg"
                )}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="space-y-4">
                  {/* Header with time and badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      {card.type === 'reminder' && card.timeRelevant && (
                        <div className="flex items-center gap-1 text-xs text-meld-ember font-medium">
                          <span>{card.timeRelevant}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs capitalize px-2 py-1", getBadgeVariant(card.type))}
                        >
                          {card.type}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-meld-ink/40 group-hover:text-meld-ink/60 transition-colors flex-shrink-0 mt-1" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-meld-ink leading-tight">
                      {card.title}
                    </h4>
                    <p className="text-sm text-meld-ink/80 leading-relaxed">
                      {card.content}
                    </p>
                  </div>

                  {/* Past-self Cue */}
                  {card.pastSelfCue && (
                    <div className="p-3 bg-meld-graysmoke/30 rounded-lg border-l-2 border-meld-sand">
                      <p className="text-xs text-meld-ink/70 italic leading-relaxed">
                        {card.pastSelfCue}
                      </p>
                    </div>
                  )}

                  {/* Context */}
                  {card.context && (
                    <div className="text-xs text-meld-ink/50 italic leading-relaxed">
                      {card.context}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-meld-sand text-meld-ink hover:bg-meld-sand/10 text-sm"
                  >
                    {card.actionLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const renderChatPreview = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-meld-ink text-white text-xs">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-meld-ink text-sm">{mockChatThread.title}</div>
            <div className="text-xs text-meld-ink/60">{mockChatThread.timestamp}</div>
          </div>
        </div>
        {mockChatThread.unreadCount && (
          <Badge variant="secondary" className="bg-meld-ember text-white text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
            {mockChatThread.unreadCount}
          </Badge>
        )}
      </div>

      <div className="bg-meld-graysmoke/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-meld-ink/80 leading-relaxed">
          {mockChatThread.lastMessage}
        </p>
      </div>

      <div className="flex-1 space-y-3">
        <div className="text-xs text-meld-ink/60 mb-3">Recent messages:</div>
        <div className="space-y-3">
          <div className="text-sm text-meld-ink/70 leading-relaxed">
            "How can I improve my storytelling in presentations?"
          </div>
          <div className="text-sm text-meld-ink/70 leading-relaxed">
            "I want to work on building confidence when speaking..."
          </div>
          <div className="text-sm text-meld-ink/70 leading-relaxed">
            "What are some techniques for handling difficult questions?"
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-meld-ink hover:bg-meld-ink/90 text-white mt-6"
        onClick={() => setActiveChat(null)}
      >
        Open Full Chat
      </Button>
    </div>
  );

  return (
    <div className={cn("w-90 bg-meld-canvas border-l border-gray-200 flex-shrink-0", className)}>
      <div className="p-6 h-full">
        {activeChat ? renderChatPreview() : renderCoachFeed()}
      </div>
    </div>
  );
}

export default ContextDock;
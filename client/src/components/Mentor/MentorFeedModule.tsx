import React, { useState } from 'react';
import { Lightbulb, Target, Zap, Check, Filter } from 'lucide-react';
import { Button } from '~/components/ui';
import { cn } from '~/utils';

interface MentorCard {
  id: string;
  type: 'insight' | 'nudge' | 'journal-prompt' | 'task-nudge';
  title: string;
  content: string;
  timestamp: string;
  source: string;
  primaryAction?: string;
  secondaryAction?: string;
  isRead: boolean;
}

const typeConfig = {
  insight: {
    icon: Lightbulb,
    label: 'Insight',
    color: 'text-meld-sand',
    bgColor: 'bg-meld-sand/10',
  },
  nudge: {
    icon: Target,
    label: 'Nudge',
    color: 'text-meld-sage',
    bgColor: 'bg-meld-sage/10',
  },
  'task-nudge': {
    icon: Target,
    label: 'Task Nudge',
    color: 'text-meld-sage',
    bgColor: 'bg-meld-sage/10',
  },
  'journal-prompt': {
    icon: Zap,
    label: 'Journal Prompt',
    color: 'text-meld-rose',
    bgColor: 'bg-meld-rose/10',
  },
};

const mockMentorCards: MentorCard[] = [
  {
    id: '1',
    type: 'insight',
    title: 'Pattern Recognition',
    content: 'I noticed you\'ve mentioned feeling "behind" in 3 recent fragments. This might be worth exploring - are you setting realistic expectations for your progress?',
    timestamp: '2 hours ago',
    source: 'Fragment Analysis',
    primaryAction: 'Explore Pattern',
    secondaryAction: 'Journal About This',
    isRead: false,
  },
  {
    id: '2',
    type: 'task-nudge',
    title: 'Weekly Reflection Due',
    content: 'It\'s been 7 days since your last weekly reflection. Ready to process this week\'s wins and learnings?',
    timestamp: '4 hours ago',
    source: 'Reflection Cadence',
    primaryAction: 'Start Reflection',
    secondaryAction: 'Reschedule',
    isRead: false,
  },
  {
    id: '3',
    type: 'journal-prompt',
    title: 'Project Momentum Check',
    content: 'You started tracking "Creative Writing Practice" 2 weeks ago. How\'s the momentum feeling? Any adjustments needed?',
    timestamp: '1 day ago',
    source: 'Project Tracking',
    primaryAction: 'Update Status',
    secondaryAction: 'Adjust Goals',
    isRead: true,
  },
];

export function MentorFeedModule() {
  const [cards, setCards] = useState(mockMentorCards);
  const [filterType, setFilterType] = useState<string>('all');

  const typeFilters = [
    { key: 'all', label: 'All' },
    { key: 'insight', label: 'Insights' },
    { key: 'nudge', label: 'Nudges' },
    { key: 'journal-prompt', label: 'Prompts' },
  ];

  const filteredCards = cards.filter(
    (card) => filterType === 'all' || card.type === filterType || (filterType === 'nudge' && card.type === 'task-nudge')
  );

  const unreadCount = cards.filter((card) => !card.isRead).length;

  const handleMarkAllRead = () => {
    setCards(prev => prev.map(card => ({ ...card, isRead: true })));
  };

  const handleCardClick = (cardId: string) => {
    setCards(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, isRead: true } : card
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-meld-canvas">
      {/* Header */}
      <div className="px-8 py-6 border-b border-meld-graysmoke/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-2xl text-meld-ink mb-2">
              Mentor Feed
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-meld-ink/60">
                {unreadCount > 0
                  ? `${unreadCount} unread insights`
                  : 'All caught up'}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-meld-sage hover:text-meld-sage/80 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          {typeFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={filterType === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(filter.key)}
              className={cn(
                filterType === filter.key
                  ? 'bg-meld-sand text-meld-ink hover:bg-meld-sand/90'
                  : 'text-meld-ink/70 hover:text-meld-ink border-meld-ink/20 hover:border-meld-sand',
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {filteredCards.map((card) => {
            const config = typeConfig[card.type];
            const TypeIcon = config.icon;
            
            return (
              <div
                key={card.id}
                className={cn(
                  'bg-white rounded-lg border transition-all duration-200 cursor-pointer group',
                  card.isRead
                    ? 'border-meld-graysmoke/50 opacity-80'
                    : 'border-meld-graysmoke/50 hover:border-meld-sand/50 hover:shadow-md'
                )}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', config.bgColor)}>
                        <TypeIcon className={cn('w-5 h-5', config.color)} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium px-2 py-1 rounded-full', config.bgColor, config.color)}>
                            {config.label}
                          </span>
                          {!card.isRead && (
                            <div className="w-2 h-2 bg-meld-ember rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-meld-ink/60 mt-1">
                          {card.source} • {card.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <h3 className="font-medium text-meld-ink mb-2 leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-sm text-meld-ink/80 leading-relaxed">
                      {card.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {card.primaryAction && (
                      <Button
                        size="sm"
                        className="bg-meld-sand hover:bg-meld-sand/90 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Primary action:', card.primaryAction, card.id);
                        }}
                      >
                        {card.primaryAction}
                      </Button>
                    )}
                    {card.secondaryAction && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-meld-graysmoke text-meld-ink hover:bg-meld-graysmoke/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Secondary action:', card.secondaryAction, card.id);
                        }}
                      >
                        {card.secondaryAction}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-meld-ink/40 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-meld-ink mb-2">No insights in this filter</h3>
              <p className="text-meld-ink/60">Try selecting a different filter or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
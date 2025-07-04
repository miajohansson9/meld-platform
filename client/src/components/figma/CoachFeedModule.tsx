import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import {
  MoreHorizontal,
  Clock,
  VolumeX,
  HelpCircle,
  X,
  Check,
  Archive,
  Info,
  Brain,
  BookOpen,
  Target,
  Lightbulb,
} from "lucide-react";
import { cn } from '~/utils';
import { ScrollArea } from "../ui/ScrollArea";

interface CoachCard {
  id: string;
  type: "insight" | "nudge" | "journal-prompt" | "task-nudge";
  title: string;
  content: string;
  timestamp: string;
  source: string;
  sourceDetails: string;
  primaryAction?: string;
  secondaryAction?: string;
  isRead: boolean;
  canSnooze: boolean;
  canMute: boolean;
}

const typeConfig = {
  insight: {
    label: "Coach Insight",
    icon: Brain,
    color: "#2E7D32",
    bgColor: "#E8F5E8",
  },
  nudge: {
    label: "Nudge",
    icon: Target,
    color: "#FF6B35",
    bgColor: "#FFF4F2",
  },
  "journal-prompt": {
    label: "Journal Prompt",
    icon: BookOpen,
    color: "#3F51B5",
    bgColor: "#E8EAF6",
  },
  "task-nudge": {
    label: "Task Nudge",
    icon: Lightbulb,
    color: "#F57C00",
    bgColor: "#FFF3E0",
  },
} as const;

const typeFilters = [
  { key: "all" as const, label: "All", shortcut: "0" },
  { key: "insight" as const, label: "Insights", shortcut: "1" },
  { key: "nudge" as const, label: "Nudges", shortcut: "2" },
  { key: "journal-prompt" as const, label: "Journal", shortcut: "3" },
  { key: "task-nudge" as const, label: "Tasks", shortcut: "4" },
];

export interface CoachFeedModuleProps {
  variant?: 'preview' | 'full';
  maxItems?: number;
  className?: string;
  isLoading?: boolean;
}

export default function CoachFeedModule({ 
  variant = 'full', 
  maxItems,
  className,
  isLoading = false 
}: CoachFeedModuleProps) {
  const [filterType, setFilterType] = useState<
    "all" | "insight" | "nudge" | "journal-prompt" | "task-nudge"
  >("all");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState<
    number | null
  >(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const mockCards: CoachCard[] = [
    {
      id: "1",
      type: "insight",
      title: "Pattern: Productivity peaks after morning reflection",
      content: "Your daily ratings show consistently higher productivity on days when you complete morning reflection. This 18-day trend suggests reflection primes your mental clarity.",
      timestamp: "2 hours ago",
      source: "Performance Analysis",
      sourceDetails: "Based on 18 days of productivity and reflection data",
      primaryAction: "View Analysis",
      secondaryAction: "Adjust Settings",
      isRead: false,
      canSnooze: true,
      canMute: true,
    },
    {
      id: "2",
      type: "nudge",
      title: "Schedule reflection time for tomorrow",
      content: "You've mentioned wanting to build a consistent reflection practice. Would you like to block 15 minutes tomorrow morning?",
      timestamp: "4 hours ago",
      source: "Goal Tracker",
      sourceDetails: "Based on your stated intention to build reflection habits",
      primaryAction: "Schedule Now",
      secondaryAction: "Skip",
      isRead: false,
      canSnooze: true,
      canMute: false,
    },
    {
      id: "3",
      type: "journal-prompt",
      title: "Reflect on your energy patterns",
      content: "What time of day do you feel most creative and focused? How could you design your schedule to honor these natural rhythms?",
      timestamp: "6 hours ago",
      source: "Weekly Check-in",
      sourceDetails: "Generated based on your energy tracking preferences",
      primaryAction: "Start Writing",
      secondaryAction: "Save for Later",
      isRead: true,
      canSnooze: false,
      canMute: true,
    },
    {
      id: "4",
      type: "task-nudge",
      title: "Review quarterly goals",
      content: "It's been 6 weeks since you last reviewed your Q2 goals. A quick check-in could help you stay aligned with your priorities.",
      timestamp: "1 day ago",
      source: "Goal Management",
      sourceDetails: "Triggered by time-based reminder preferences",
      primaryAction: "Review Goals",
      isRead: false,
      canSnooze: true,
      canMute: true,
    },
    {
      id: "5",
      type: "insight",
      title: "Deep work sessions correlate with exercise",
      content: "Your focus ratings are 40% higher on days when you exercise. This pattern is consistent across 3 weeks of data tracking.",
      timestamp: "2 days ago",
      source: "Habit Analysis",
      sourceDetails: "Cross-referenced exercise logs with focus ratings",
      primaryAction: "See Details",
      secondaryAction: "Set Reminder",
      isRead: true,
      canSnooze: false,
      canMute: true,
    },
  ];

  // Filter and limit cards based on variant
  const filteredCards = filterType === "all" 
    ? mockCards 
    : mockCards.filter(card => card.type === filterType);
  
  const displayCards = maxItems 
    ? filteredCards.slice(0, maxItems)
    : filteredCards;

  const unreadCount = displayCards.filter(card => !card.isRead).length;
  const isMultiSelectMode = selectedCards.length > 0;
  const showBulkActions = selectedCards.length > 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;

      // Filter shortcuts (0-4)
      const filterKey = parseInt(e.key);
      if (filterKey >= 0 && filterKey <= 4) {
        e.preventDefault();
        setFilterType(typeFilters[filterKey].key);
        return;
      }

      // Navigation with improved scroll behavior
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const newIndex = Math.max(
          0,
          Math.min(
            displayCards.length - 1,
            (highlightedCardIndex ?? -1) + direction,
          ),
        );
        setHighlightedCardIndex(newIndex);
        
        // Scroll highlighted card into view
        if (cardsRef.current) {
          const cardElements = cardsRef.current.querySelectorAll('[role="article"]');
          const targetCard = cardElements[newIndex];
          if (targetCard) {
            targetCard.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'nearest'
            });
          }
        }
      }

      if (e.key === "Enter" && highlightedCardIndex !== null) {
        e.preventDefault();
        const card = displayCards[highlightedCardIndex];
        if (card?.primaryAction) {
          handlePrimaryActionClick(
            {} as React.MouseEvent,
            card.primaryAction,
            card.id,
          );
        }
      }

      // Escape to clear selection
      if (e.key === "Escape") {
        setSelectedCards([]);
        setHighlightedCardIndex(null);
      }

      // Space to select/deselect highlighted card
      if (e.key === " " && highlightedCardIndex !== null) {
        e.preventDefault();
        const cardId = displayCards[highlightedCardIndex].id;
        handleCardSelect(cardId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedCardIndex, displayCards, filterType, selectedCards]);

  const handleCardSelect = (
    cardId: string,
    isShiftClick: boolean = false,
  ) => {
    if (isShiftClick && selectedCards.length > 0) {
      // Range selection logic
      const lastSelectedIndex = displayCards.findIndex(
        card => card.id === selectedCards[selectedCards.length - 1],
      );
      const currentIndex = displayCards.findIndex(card => card.id === cardId);
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = displayCards.slice(start, end + 1).map(card => card.id);
      setSelectedCards(prev => [...new Set([...prev, ...rangeIds])]);
    } else {
      setSelectedCards(prev =>
        prev.includes(cardId)
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId],
      );
    }
  };

  const handleSelectAll = () => {
    setSelectedCards(displayCards.map(card => card.id));
  };

  const handleDeselectAll = () => {
    setSelectedCards([]);
  };

  const handleMarkAllRead = () => {
    console.log("Marking all cards as read");
    setSelectedCards([]);
  };

  const handleBulkArchive = () => {
    console.log("Archiving selected cards:", selectedCards);
    setSelectedCards([]);
  };

  const handleBulkMute = () => {
    console.log("Muting triggers for selected cards:", selectedCards);
    setSelectedCards([]);
  };

  const handleBulkMarkRead = () => {
    console.log("Marking selected cards as read:", selectedCards);
    setSelectedCards([]);
  };

  const handleSnoozeCard = (cardId: string, days: number) => {
    console.log(`Snoozing card ${cardId} for ${days} days`);
  };

  const handleCardAction = (action: string, cardId: string) => {
    console.log(`Card action: ${action} for card ${cardId}`);
    
    // Mark card as read when action is taken
    if (action === "View Analysis" || action === "Start Writing") {
      // Update card read status
    }
  };

  const handlePrimaryActionClick = (
    e: React.MouseEvent,
    action: string,
    cardId: string,
  ) => {
    e.stopPropagation();
    handleCardAction(action, cardId);
  };

  const handleSecondaryActionClick = (
    e: React.MouseEvent,
    action: string,
    cardId: string,
  ) => {
    e.stopPropagation();
    handleCardAction(action, cardId);
  };

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-xl border border-meld-ink/20 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-meld-graysmoke/50 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-5 bg-meld-graysmoke/50 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-meld-graysmoke/30 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-meld-graysmoke/30 rounded animate-pulse" />
        <div className="h-4 bg-meld-graysmoke/30 rounded w-5/6 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-meld-graysmoke/50 rounded w-24 animate-pulse" />
        <div className="h-8 bg-meld-graysmoke/30 rounded w-20 animate-pulse" />
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-meld-graysmoke/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Brain className="w-8 h-8 text-meld-ink/40" />
      </div>
      <h3 className="text-lg font-medium text-meld-ink mb-2">
        All caught up!
      </h3>
      <p className="text-meld-ink/60 text-sm max-w-sm mx-auto">
        No new insights or nudges right now. Check back later or adjust your cadence settings.
      </p>
    </div>
  );

  // Preview mode for Today page
  if (variant === 'preview') {
    return (
      <div className={cn("bg-white rounded-xl border border-meld-ink/20", className)}>
        <div className="p-6 border-b border-meld-graysmoke/30">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-meld-ink">Mentor Feed</h2>
            {unreadCount > 0 && (
              <span className="text-sm text-meld-ink/60">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {displayCards.map((card) => {
            const config = typeConfig[card.type];
            const TypeIcon = config.icon;

            return (
              <div
                key={card.id}
                className="border border-meld-ink/20 group bg-meld-graysmoke/20 rounded-lg p-4 hover:bg-meld-graysmoke/30 transition-colors cursor-pointer"
                onClick={() => handleCardAction(card.primaryAction || 'view', card.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <TypeIcon
                      className="w-4 h-4"
                      style={{ color: config.color }}
                      strokeWidth={1.5}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-meld-ink text-sm line-clamp-1">
                        {card.title}
                      </h3>
                      {!card.isRead && (
                        <div className="w-2 h-2 bg-meld-sand rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <span
                      className="text-xs px-2 py-0.5 bg-white border rounded-full font-medium"
                      style={{
                        color: config.color,
                        borderColor: config.color,
                      }}
                    >
                      {config.label}
                    </span>

                    <p className="text-meld-ink/70 text-sm leading-relaxed mt-2 line-clamp-2">
                      {card.content}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      {card.primaryAction && (
                        <Button
                          size="sm"
                          onClick={(e) =>
                            handlePrimaryActionClick(
                              e,
                              card.primaryAction!,
                              card.id,
                            )
                          }
                          className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink text-xs h-7 px-3"
                        >
                          {card.primaryAction}
                        </Button>
                      )}
                      {card.secondaryAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) =>
                            handleSecondaryActionClick(
                              e,
                              card.secondaryAction!,
                              card.id,
                            )
                          }
                          className="text-meld-ink/70 hover:text-meld-ink text-xs h-7 px-3"
                        >
                          {card.secondaryAction}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full mode - detailed layout for Mentor Feed page
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mt-12 mb-12">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-xl text-meld-ink mb-1">
              Mentor Feed
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-meld-ink/60 text-sm">
                {unreadCount > 0
                  ? `${unreadCount} unread insights`
                  : "All caught up"}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-meld-sage hover:text-meld-sage/80 flex items-center gap-1 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {typeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              className={cn(
                "relative text-xs h-8 px-3 rounded-full transition-colors",
                filterType === filter.key
                  ? "bg-meld-sand text-meld-ink"
                  : "text-meld-ink/70 hover:text-meld-ink bg-meld-graysmoke/30 hover:bg-meld-sand/20",
              )}
            >
              {filter.label}
              <span className="absolute -top-1 -right-1 text-xs text-meld-ink/40 font-mono text-[10px]">
                {filter.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Multi-select Header */}
      {isMultiSelectMode && (
        <div className="flex items-center justify-between mt-4 p-3 bg-meld-sage/10 rounded-lg mx-6 lg:mx-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-meld-ink">
              {selectedCards.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="text-meld-ink/60 hover:text-meld-ink p-1 h-auto"
            >
              <X className="w-4 h-4" />
              Exit
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-meld-ink/70 hover:text-meld-ink"
          >
            Select All Visible
          </Button>
        </div>
      )}

      {/* Cards List */}
      <div ref={cardsRef}>
        <div className="flex flex-col gap-4">{isLoading ? (
              // Show skeleton cards while loading
              Array.from({ length: maxItems || 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="meld-animate-in">
                  {renderSkeletonCard()}
                </div>
              ))
            ) : displayCards.length === 0 ? (
              // Show empty state
              <div className="meld-animate-in">
                {renderEmptyState()}
              </div>
            ) : (
              // Show actual cards
              displayCards.map((card, index) => {
                const config = typeConfig[card.type];
                const TypeIcon = config.icon;
                const isSelected = selectedCards.includes(card.id);
                const isHighlighted = highlightedCardIndex === index;

              return (
                <div
                  key={card.id}
                  className={cn(
                    "group bg-white rounded-xl border border-meld-ink/20 transition-all duration-200 shadow-sm",
                    isSelected &&
                      "ring-2 ring-meld-sand ring-offset-2",
                    isHighlighted &&
                      "ring-2 ring-meld-sand/50 ring-offset-1",
                    !isSelected &&
                      !isHighlighted &&
                      "hover:shadow-md hover:-translate-y-0.5",
                    "focus-within:ring-2 focus-within:ring-meld-sand focus-within:ring-offset-2",
                  )}
                  role="article"
                  aria-labelledby={`card-title-${card.id}`}
                  tabIndex={0}
                >
                  <div className="p-6">
                    {/* Enhanced Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon with better styling */}
                        <div
                          className="p-3 rounded-xl shadow-sm"
                          style={{
                            backgroundColor: config.bgColor,
                          }}
                        >
                          <TypeIcon
                            className="w-5 h-5"
                            style={{ color: config.color }}
                            strokeWidth={1.5}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Title with better typography */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              id={`card-title-${card.id}`}
                              className="font-semibold text-meld-ink text-lg leading-tight"
                            >
                              {card.title}
                            </h3>
                            {!card.isRead && (
                              <div className="w-2.5 h-2.5 bg-meld-sand rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Type badge with improved styling */}
                          <div className="flex items-center gap-3">
                            <span
                              className="text-xs px-3 py-1 bg-white border rounded-full font-medium"
                              style={{
                                color: config.color,
                                borderColor: config.color,
                              }}
                            >
                              {config.label}
                            </span>
                            <span className="text-sm text-meld-ink/50">
                              {card.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-meld-ink/40 hover:text-meld-ink p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal
                              className="w-4 h-4"
                              strokeWidth={1.25}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {card.canSnooze && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSnoozeCard(card.id, 7)
                                }
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze 7 days
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSnoozeCard(card.id, 1)
                                }
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze 1 day
                              </DropdownMenuItem>
                            </>
                          )}
                          {card.canMute && (
                            <DropdownMenuItem>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Lower cadence
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Why this nudge?
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Enhanced Content Section */}
                    <div className="mb-6">
                      <p className="text-meld-ink leading-relaxed text-[15px] mb-4 font-normal">
                        {card.content}
                      </p>

                      {/* Source info with better styling */}
                      <div className="flex items-start gap-2 p-3 bg-meld-graysmoke/30 rounded-lg">
                        <Info
                          className="w-4 h-4 text-meld-ink/40 mt-0.5 flex-shrink-0"
                          strokeWidth={1.25}
                        />
                        <div>
                          <p className="text-meld-ink/60 text-sm font-medium">
                            {card.source}
                          </p>
                          <p className="text-meld-ink/40 text-xs leading-relaxed mt-1">
                            {card.sourceDetails}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {card.primaryAction && (
                        <Button
                          onClick={(e) =>
                            handlePrimaryActionClick(
                              e,
                              card.primaryAction!,
                              card.id,
                            )
                          }
                          className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink font-medium px-4 py-2 h-auto"
                        >
                          {card.primaryAction}
                        </Button>
                      )}
                      {card.secondaryAction && (
                        <Button
                          variant="ghost"
                          onClick={(e) =>
                            handleSecondaryActionClick(
                              e,
                              card.secondaryAction!,
                              card.id,
                            )
                          }
                          className="text-meld-ink/70 hover:text-meld-ink font-medium px-4 py-2 h-auto"
                        >
                          {card.secondaryAction}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bulk Actions Footer */}
      {showBulkActions && (
        <div className="sticky bottom-0 border-t border-meld-ink/20 bg-white/95 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm text-meld-ink/70">
              {selectedCards.length} cards selected
            </span>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkRead}
                className="text-meld-ink/70 hover:text-meld-ink"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMute}
                className="text-meld-ink/70 hover:text-meld-ink"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Mute Trigger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                className="text-meld-ink/70 hover:text-meld-ink"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
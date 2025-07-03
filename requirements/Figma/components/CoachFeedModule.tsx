import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  MoreHorizontal,
  Clock,
  VolumeX,
  Archive,
  HelpCircle,
  CheckSquare,
  Square,
  X,
  Lightbulb,
  Target,
  BookOpen,
  Zap,
  Check,
  Info,
  ArrowLeft,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { cn } from "./ui/utils";
import { toast } from "sonner";

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
    icon: Lightbulb,
    label: "Insight",
    color: "var(--meld-sand)",
    bgColor: "var(--meld-sand)/10",
  },
  nudge: {
    icon: Target,
    label: "Nudge",
    color: "var(--meld-sage)",
    bgColor: "var(--meld-sage)/10",
  },
  "task-nudge": {
    icon: Target,
    label: "Nudge (Task)",
    color: "var(--meld-sage)",
    bgColor: "var(--meld-sage)/10",
  },
  "journal-prompt": {
    icon: Zap,
    label: "Journal Prompt",
    color: "var(--meld-rose)",
    bgColor: "var(--meld-rose)/10",
  },
};

const mockCoachCards: CoachCard[] = [
  {
    id: "1",
    type: "insight",
    title: "Pattern Recognition",
    content:
      'I noticed you\'ve mentioned feeling "behind" in 3 recent fragments. This might be worth exploring - are you setting realistic expectations for your progress?',
    timestamp: "2 hours ago",
    source: "Fragment Analysis",
    sourceDetails:
      "Triggered by recurring language patterns in daily entries",
    primaryAction: "Explore Pattern",
    secondaryAction: "Journal About This",
    isRead: false,
    canSnooze: true,
    canMute: true,
  },
  {
    id: "2",
    type: "task-nudge",
    title: "Weekly Reflection Due",
    content:
      "It's been 7 days since your last weekly reflection. Ready to process this week's wins and learnings?",
    timestamp: "4 hours ago",
    source: "Reflection Cadence",
    sourceDetails:
      "Scheduled based on your weekly rhythm preferences",
    primaryAction: "Start Reflection",
    secondaryAction: "Reschedule",
    isRead: false,
    canSnooze: true,
    canMute: false,
  },
  {
    id: "3",
    type: "journal-prompt",
    title: "Project Momentum Check",
    content:
      'You started tracking "Creative Writing Practice" 2 weeks ago. How\'s the momentum feeling? Any adjustments needed?',
    timestamp: "1 day ago",
    source: "Project Tracking",
    sourceDetails:
      "Auto-generated from project start date + 2 weeks",
    primaryAction: "Update Status",
    secondaryAction: "Adjust Goals",
    isRead: true,
    canSnooze: true,
    canMute: true,
  },
];

export function CoachFeedModule() {
  const [cards, setCards] =
    useState<CoachCard[]>(mockCoachCards);
  const [selectedCards, setSelectedCards] = useState<string[]>(
    [],
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [cadence, setCadence] = useState([1]); // 0 = Low, 1 = Standard, 2 = High-touch
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] =
    useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] =
    useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [density, setDensity] = useState<
    "comfortable" | "compact"
  >("comfortable");

  const cadenceLabels = ["Low", "Standard", "High-touch"];
  const typeFilters = [
    { key: "all", label: "All", shortcut: "1" },
    { key: "insight", label: "Insight", shortcut: "2" },
    { key: "nudge", label: "Nudge", shortcut: "3" },
    { key: "task-nudge", label: "Nudge (Task)", shortcut: "4" },
    {
      key: "journal-prompt",
      label: "Journal Prompt",
      shortcut: "5",
    },
  ];

  const filteredCards = cards.filter(
    (card) => filterType === "all" || card.type === filterType,
  );

  const unreadCount = cards.filter(
    (card) => !card.isRead,
  ).length;
  const cardsRef = useRef<HTMLDivElement>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Filter shortcuts
      const filterShortcut = typeFilters.find(
        (filter) => filter.shortcut === e.key,
      );
      if (filterShortcut && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setFilterType(filterShortcut.key);
        return;
      }

      // Arrow navigation
      if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        !isMultiSelectMode
      ) {
        e.preventDefault();
        const direction = e.key === "ArrowUp" ? -1 : 1;
        const newIndex = Math.max(
          0,
          Math.min(
            filteredCards.length - 1,
            highlightedCardIndex + direction,
          ),
        );
        setHighlightedCardIndex(newIndex);
      }

      // Enter actions
      if (e.key === "Enter" && highlightedCardIndex >= 0) {
        e.preventDefault();
        const card = filteredCards[highlightedCardIndex];
        if (e.shiftKey && card.secondaryAction) {
          handleCardAction(card.secondaryAction, card.id);
        } else if (card.primaryAction) {
          handleCardAction(card.primaryAction, card.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedCardIndex, filteredCards, isMultiSelectMode]);

  const handleCardSelect = (
    cardId: string,
    isShiftClick: boolean = false,
  ) => {
    if (isShiftClick || isMultiSelectMode) {
      if (!isMultiSelectMode) {
        setIsMultiSelectMode(true);
      }

      setSelectedCards((prev) => {
        const newSelection = prev.includes(cardId)
          ? prev.filter((id) => id !== cardId)
          : [...prev, cardId];

        setShowBulkActions(newSelection.length > 0);
        return newSelection;
      });
    }
  };

  const handleSelectAll = () => {
    const allVisible = filteredCards.map((card) => card.id);
    setSelectedCards(allVisible);
    setShowBulkActions(true);
    setIsMultiSelectMode(true);
  };

  const handleDeselectAll = () => {
    setSelectedCards([]);
    setShowBulkActions(false);
    setIsMultiSelectMode(false);
  };

  const handleMarkAllRead = () => {
    setCards((prev) =>
      prev.map((card) => ({ ...card, isRead: true })),
    );
    toast.success("All insights marked as read", {
      duration: 2000,
    });
  };

  const handleBulkArchive = () => {
    setCards((prev) =>
      prev.filter((card) => !selectedCards.includes(card.id)),
    );
    toast.success(`Archived ${selectedCards.length} cards`, {
      duration: 2000,
    });
    handleDeselectAll();
  };

  const handleBulkMute = () => {
    toast.success(
      `Muted sources for ${selectedCards.length} cards`,
      { duration: 2000 },
    );
    handleDeselectAll();
  };

  const handleBulkMarkRead = () => {
    setCards((prev) =>
      prev.map((card) =>
        selectedCards.includes(card.id)
          ? { ...card, isRead: true }
          : card,
      ),
    );
    toast.success(
      `Marked ${selectedCards.length} cards as read`,
      { duration: 2000 },
    );
    handleDeselectAll();
  };

  const handleSnoozeCard = (cardId: string, days: number) => {
    setCards((prev) =>
      prev.filter((card) => card.id !== cardId),
    );
    toast.success(`Snoozed for ${days} days`, {
      duration: 2000,
    });
  };

  const handleCardAction = (action: string, cardId: string) => {
    // Mark as read when action is taken
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isRead: true } : card,
      ),
    );

    // Simulate navigation to chat
    if (
      action === "Explore Pattern" ||
      action === "Start Reflection"
    ) {
      toast.success(`Opening chat: ${action}`, {
        duration: 2000,
      });
    } else {
      toast.success(`${action} completed`, { duration: 2000 });
    }
  };

  const handleCadenceChange = (newCadence: number[]) => {
    setCadence(newCadence);
    const level = cadenceLabels[newCadence[0]];
    const frequency =
      newCadence[0] === 0
        ? "2-3 nudges/week"
        : newCadence[0] === 1
          ? "4-5 nudges/week"
          : "6-7 nudges/week";
    toast.success(
      `Cadence set to ${level} — up to ${frequency}`,
      { duration: 3000 },
    );
  };

  const handleNarrativeBanner = () => {
    toast.success("Opening Narrative Compass wizard", {
      duration: 2000,
    });
  };

  const handlePrimaryActionClick = (
    e: React.MouseEvent,
    action: string,
    cardId: string,
  ) => {
    if (e.shiftKey) {
      e.preventDefault();
      handleCardSelect(cardId, true);
    } else {
      handleCardAction(action, cardId);
    }
  };

  const handleSecondaryActionClick = (
    e: React.MouseEvent,
    action: string,
    cardId: string,
  ) => {
    if (e.shiftKey) {
      e.preventDefault();
      handleCardSelect(cardId, true);
    } else {
      handleCardAction(action, cardId);
    }
  };

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-lg border border-gray-100 animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-gray-200 rounded w-32"></div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-meld-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lightbulb
            className="w-12 h-12 text-meld-sage"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="font-serif text-xl text-meld-ink mb-3">
          You're in flow
        </h3>
        <p className="text-meld-ink/70 leading-relaxed mb-6">
          Insights will appear when patterns emerge or moments
          approach.
        </p>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="text-meld-ink/70 hover:text-meld-ink"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Today
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="px-8 py-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 rounded w-20 animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                {renderSkeletonCard()}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filteredCards.length === 0 && filterType === "all") {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif text-2xl text-meld-ink mb-2">
                Mentor Insights
              </h1>
              <p className="text-meld-ink/60">
                Your mentorship control room
              </p>
            </div>

            {/* Cadence Control */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-meld-ink/70">
                  Cadence
                </span>
                <div className="flex items-center gap-3 w-32">
                  <span className="text-xs text-meld-ink/60">
                    Low
                  </span>
                  <Slider
                    value={cadence}
                    onValueChange={handleCadenceChange}
                    max={2}
                    min={0}
                    step={1}
                    className="flex-1 meld-slider-enhanced"
                  />
                  <span className="text-xs text-meld-ink/60">
                    High
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {typeFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={
                    filterType === filter.key
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setFilterType(filter.key)}
                  className={cn(
                    "relative",
                    filterType === filter.key
                      ? "bg-meld-sand text-meld-ink hover:bg-meld-sand/90"
                      : "text-meld-ink/70 hover:text-meld-ink border-meld-ink/20 hover:border-meld-sand",
                  )}
                  title={`Press ${filter.shortcut} to select`}
                >
                  {filter.label}
                  <span className="absolute -top-2 -right-2 text-xs text-meld-ink/40 font-mono">
                    {filter.shortcut}
                  </span>
                </Button>
              ))}
            </div>

            {/* Density Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-meld-ink/70">
                View
              </span>
              <Button
                variant={
                  density === "comfortable"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setDensity("comfortable")}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={
                  density === "compact" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setDensity("compact")}
                className="p-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-serif text-2xl text-meld-ink mb-2">
                Mentor Insights
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-meld-ink/60">
                  {unreadCount > 0
                    ? `${unreadCount} unread insights`
                    : "All caught up"}
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

          {/* Cadence Control - repositioned */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-meld-ink/70">
              Cadence
            </span>
            <div className="flex items-center gap-3 w-32">
              <span className="text-xs text-meld-ink/60">
                Low
              </span>
              <Slider
                value={cadence}
                onValueChange={handleCadenceChange}
                max={2}
                min={0}
                step={1}
                className="flex-1 meld-slider-enhanced"
              />
              <span className="text-xs text-meld-ink/60">
                High
              </span>
            </div>
          </div>
        </div>

        {/* Filter Chips and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {typeFilters.map((filter) => (
              <Button
                key={filter.key}
                variant={
                  filterType === filter.key
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setFilterType(filter.key)}
                className={cn(
                  "relative",
                  filterType === filter.key
                    ? "bg-meld-sand text-meld-ink hover:bg-meld-sand/90"
                    : "text-meld-ink/70 hover:text-meld-ink border-meld-ink/20 hover:border-meld-sand",
                )}
                title={`Press ${filter.shortcut} to select`}
              >
                {filter.label}
                <span className="absolute -top-2 -right-2 text-xs text-meld-ink/40 font-mono">
                  {filter.shortcut}
                </span>
              </Button>
            ))}
          </div>

          {/* Density Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-meld-ink/70">
              View
            </span>
            <Button
              variant={
                density === "comfortable"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => setDensity("comfortable")}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={
                density === "compact" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setDensity("compact")}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Multi-select Header */}
        {isMultiSelectMode && (
          <div className="flex items-center justify-between mt-4 p-3 bg-meld-sage/10 rounded-lg">
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
      </div>

      {/* Next Check-in Banner - now clickable with sage background */}
      <div
        className="px-8 py-3 bg-[#EEF4EE] border-b border-meld-sage/20 cursor-pointer hover:bg-[#E8F0E8] transition-colors"
        onClick={handleNarrativeBanner}
      >
        <p className="text-sm text-meld-ink/70">
          <strong>Next Narrative Check-in due:</strong>{" "}
          Thursday, July 3rd
        </p>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-auto" ref={cardsRef}>
        <div className="px-8 py-6 space-y-6">
          {filteredCards.map((card, index) => {
            const config = typeConfig[card.type];
            const TypeIcon = config.icon;
            const isSelected = selectedCards.includes(card.id);
            const isHighlighted =
              highlightedCardIndex === index;

            return (
              <div
                key={card.id}
                className={cn(
                  "group bg-white rounded-lg border transition-all duration-200",
                  isSelected &&
                    "ring-2 ring-meld-sand ring-offset-2",
                  isHighlighted &&
                    "ring-2 ring-meld-sand/50 ring-offset-1",
                  !isSelected &&
                    !isHighlighted &&
                    "border-gray-100 hover:shadow-lg hover:border-gray-200",
                  "focus-within:ring-2 focus-within:ring-meld-sand focus-within:ring-offset-2",
                )}
                role="article"
                aria-labelledby={`card-title-${card.id}`}
                tabIndex={0}
              >
                <div
                  className={cn(
                    "p-6",
                    density === "compact" && "p-4",
                  )}
                >
                  {/* Header with Selection */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox - only visible in multi-select mode */}
                      {isMultiSelectMode && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleCardSelect(card.id)
                          }
                          className="transition-opacity"
                        />
                      )}

                      {/* Type Icon and Title */}
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: config.bgColor,
                          }}
                        >
                          <TypeIcon
                            className="w-5 h-5"
                            style={{ color: config.color }}
                            strokeWidth={1.25}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {/* Title with larger font - 18px semibold */}
                            <h3
                              id={`card-title-${card.id}`}
                              className="font-semibold text-meld-ink"
                              style={{ fontSize: "18px" }}
                            >
                              {card.title}
                            </h3>
                            {!card.isRead && (
                              <div className="w-2 h-2 bg-meld-sand rounded-full" />
                            )}
                          </div>
                          {/* Badge and label in same row */}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs bg-transparent"
                              style={{
                                color: config.color,
                                borderColor: config.color,
                              }}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp and Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-meld-ink/60">
                        {card.timestamp}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-meld-ink/40 hover:text-meld-ink p-1"
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
                  </div>

                  {/* Content - body 15px */}
                  <div
                    className={cn(
                      "mb-4",
                      density === "compact" && "mb-3",
                    )}
                  >
                    <p
                      className="text-meld-ink leading-relaxed mb-3"
                      style={{ fontSize: "15px" }}
                    >
                      {card.content}
                    </p>

                    {/* Source with info icon and larger text */}
                    <div className="flex items-center gap-1">
                      <Info
                        className="w-3 h-3 text-meld-ink/40"
                        strokeWidth={1.25}
                      />
                      <p
                        className="text-meld-ink/40 italic"
                        style={{ fontSize: "12px" }}
                      >
                        {card.source} • {card.sourceDetails}
                      </p>
                    </div>
                  </div>

                  {/* Actions with improved hierarchy */}
                  <div className="flex items-center gap-3">
                    {card.primaryAction && (
                      <Button
                        onClick={(e) =>
                          handlePrimaryActionClick(
                            e,
                            card.primaryAction!,
                            card.id,
                          )
                        }
                        className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink flex-1 max-w-fit"
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
                        className="text-meld-ink/70 hover:text-meld-ink"
                      >
                        {card.secondaryAction}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions Footer - sticky bottom bar */}
      {showBulkActions && (
        <div className="sticky bottom-0 border-t border-sidebar-border bg-white/95 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
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
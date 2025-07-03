import React, { useState, useEffect, useRef } from "react";
import {
  Edit3,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Copy,
  Image,
  Share,
  History,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  MessageCircle,
  Zap,
  Calendar,
  Target,
  TrendingUp,
  BookOpen,
  Eye,
  Info,
  ArrowRight,
  ExternalLink,
  Download,
  ChevronDown,
  Volume,
  VolumeX,
  Navigation,
  Heart,
  Lightbulb,
  Shield,
  Rocket,
  Users,
  BarChart3,
  ArrowUp,
  Triangle,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { cn } from "~/utils";
import { toast } from "sonner";

interface NarrativeChapter {
  id: string;
  title: string;
  content: string;
  isEdited: boolean;
  wordCount: number;
  valueHighlights: Array<{ text: string; value: string }>;
}

interface Goal {
  id: string;
  title: string;
  alignment: "strong" | "drifting" | "emerging";
  nextStep: string;
  chatId?: string;
  completed?: boolean;
}

interface DataSource {
  type: "reflection" | "fragment" | "win" | "chat";
  id: string;
  title: string;
  date: Date;
  count?: number;
  preview?: string;
}

interface NarrativeVersion {
  id: string;
  date: Date;
  headline: string;
  changes: string[];
  confidence: number;
}

interface ValueProfile {
  name: string;
  percentage: number;
  color: string;
  icon: React.ElementType;
}

const valueColors = {
  growth: "#C9D4C2", // sage
  integrity: "#D5C8A4", // sand
  courage: "#E9C4C0", // rose variation
  innovation: "#BFCDB1", // sage variant
  empathy: "#F2DBDB", // rose
};

const alignmentConfig = {
  strong: {
    icon: CheckCircle2,
    label: "Strong",
    color: "bg-meld-sage text-white",
    description: "Well aligned with your values and direction",
  },
  drifting: {
    icon: AlertTriangle,
    label: "Drifting",
    color: "bg-meld-ember text-meld-ink",
    description: "Needs attention to get back on track",
  },
  emerging: {
    icon: Sparkles,
    label: "Emerging",
    color: "bg-meld-sand text-meld-ink",
    description: "New opportunity or direction forming",
  },
};

const mockValueProfile: ValueProfile[] = [
  {
    name: "Growth",
    percentage: 34,
    color: valueColors.growth,
    icon: TrendingUp,
  },
  {
    name: "Integrity",
    percentage: 28,
    color: valueColors.integrity,
    icon: Shield,
  },
  {
    name: "Innovation",
    percentage: 22,
    color: valueColors.innovation,
    icon: Lightbulb,
  },
  {
    name: "Empathy",
    percentage: 16,
    color: valueColors.empathy,
    icon: Heart,
  },
];

const mockNarrative = {
  headline:
    "You're a growth-driven storyteller who rallies people around clear missions.",
  dominantValue: "growth",
  chapters: [
    {
      id: "values",
      title: "What drives you",
      content:
        "Growth and integrity form the foundation of how you approach both personal development and leadership. Your recent breakthrough in stakeholder communication shows how you turn tension into trust. When faced with difficult conversations, you consistently choose transparency over comfort, believing that honest dialogue creates stronger relationships and better outcomes.",
      isEdited: false,
      wordCount: 62,
      valueHighlights: [
        { text: "Growth and integrity", value: "core" },
        {
          text: "turn tension into trust",
          value: "breakthrough",
        },
      ],
    },
    {
      id: "momentum",
      title: "How you move",
      content:
        "Your daily energy patterns show a consistent commitment to learning and reflection. Morning deep-dives have become a cornerstone practice, creating space for strategic thinking before tactical demands take over. The way you capture fragments throughout the day - from meeting insights to reading quotes - reveals someone who sees connections between seemingly unrelated experiences. Your wins cluster around moments when you've successfully bridged communication gaps, whether with direct reports or senior stakeholders.",
      isEdited: false,
      wordCount: 78,
      valueHighlights: [
        {
          text: "consistent commitment to learning",
          value: "pattern",
        },
        {
          text: "sees connections between seemingly unrelated experiences",
          value: "insight",
        },
      ],
    },
    {
      id: "direction",
      title: "Where you're headed next",
      content:
        "The next 90 days present an opportunity to elevate your storytelling from good to exceptional. Your goal of improving presentation skills aligns perfectly with the emerging leadership podcast opportunity - both require the ability to distill complex narratives into memorable moments. Stakeholder buy-in is wobbling — a perfect arena to test your new clarity. Your natural tendency toward growth means you're already identifying the patterns; now it's about creating repeatable systems.",
      isEdited: true,
      wordCount: 85,
      valueHighlights: [
        {
          text: "elevate your storytelling from good to exceptional",
          value: "direction",
        },
        {
          text: "perfect arena to test your new clarity",
          value: "opportunity",
        },
      ],
    },
  ] as NarrativeChapter[],
  goals: [
    {
      id: "stakeholder-buy-in",
      title: "Pitch stakeholder buy-in",
      alignment: "strong" as const,
      nextStep: "Draft agenda",
      chatId: "stakeholder-chat",
      completed: false,
    },
    {
      id: "storytelling-skill",
      title: "Improve storytelling skill",
      alignment: "drifting" as const,
      nextStep: "Coach chat",
      chatId: "storytelling-chat",
      completed: false,
    },
    {
      id: "leadership-podcast",
      title: "Surfacing Leadership Podcast",
      alignment: "emerging" as const,
      nextStep: "Research RFP",
      completed: false,
    },
  ] as Goal[],
  dataSources: [
    {
      type: "reflection",
      id: "r1",
      title: "Deep Dive: Communication",
      date: new Date("2025-06-27"),
      count: 3,
      preview:
        "Breakthrough moment in stakeholder alignment...",
    },
    {
      type: "fragment",
      id: "f1",
      title: "Leadership insights",
      date: new Date("2025-06-25"),
      count: 8,
      preview:
        '"The best leaders are translators of complexity..."',
    },
    {
      type: "win",
      id: "w1",
      title: "Stakeholder wins",
      date: new Date("2025-06-24"),
      count: 2,
      preview:
        "Successfully navigated difficult budget conversation",
    },
    {
      type: "chat",
      id: "c1",
      title: "Mentoring threads",
      date: new Date("2025-06-26"),
      count: 4,
      preview: "Coach feedback on presentation structure",
    },
  ] as DataSource[],
  confidence: 87,
  lastUpdated: new Date("2025-06-29"),
  nextUpdateDue: new Date("2025-07-03"),
  changes: [
    {
      text: "+1 new value mention in fragments",
      type: "add",
      target: "values",
    },
    {
      text: "Stakeholder buy-in shifted from Emerging → Strong",
      type: "change",
      target: "stakeholder-goal",
    },
    {
      text: "Added 2 new communication wins",
      type: "add",
      target: "wins",
    },
    {
      text: "Updated direction based on podcast opportunity",
      type: "change",
      target: "direction",
    },
  ],
  confidenceFactors: {
    coverage: 92,
    consistency: 85,
    recency: 88,
    conflicting: 2,
  },
};

const mockVersionHistory: NarrativeVersion[] = [
  {
    id: "v3",
    date: new Date("2025-06-29"),
    headline:
      "You're a growth-driven storyteller who rallies people around clear missions.",
    changes: [
      "Updated direction chapter",
      "Added podcast opportunity",
    ],
    confidence: 87,
  },
  {
    id: "v2",
    date: new Date("2025-06-15"),
    headline:
      "You're a growth-focused leader who builds bridges through honest communication.",
    changes: [
      "Refined values language",
      "Added stakeholder goal",
    ],
    confidence: 82,
  },
  {
    id: "v1",
    date: new Date("2025-06-01"),
    headline:
      "You're someone who values growth and seeks to understand complex systems.",
    changes: ["Initial narrative generation"],
    confidence: 74,
  },
];

export function NorthStarModule() {
  const [narrative, setNarrative] = useState(mockNarrative);
  const [editingChapter, setEditingChapter] = useState<
    string | null
  >(null);
  const [editContent, setEditContent] = useState("");
  const [showVersionHistory, setShowVersionHistory] =
    useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDataSourceDrawer, setShowDataSourceDrawer] =
    useState(false);
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    [key: string]: "helpful" | "needs-work" | null;
  }>({});
  const [userComment, setUserComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showValueCrest, setShowValueCrest] = useState(false);
  const [showConfidenceFactors, setShowConfidenceFactors] =
    useState(false);
  const [showJumpNav, setShowJumpNav] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const momentumRef = useRef<HTMLDivElement>(null);
  const goalsRef = useRef<HTMLDivElement>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for scroll tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let scrolled = false;
        entries.forEach((entry) => {
          if (
            entry.target === heroRef.current &&
            !entry.isIntersecting
          ) {
            scrolled = true;
          }
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
        setShowJumpNav(scrolled);
      },
      { threshold: 0.5, rootMargin: "-100px 0px" },
    );

    const targets = [
      heroRef.current,
      valuesRef.current,
      momentumRef.current,
      goalsRef.current,
    ];
    targets.forEach(
      (target) => target && observer.observe(target),
    );

    return () => observer.disconnect();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⇧H for version history
      if (e.metaKey && e.shiftKey && e.key === "H") {
        e.preventDefault();
        setShowVersionHistory(true);
      }

      // Escape to cancel editing
      if (e.key === "Escape") {
        if (editingChapter) {
          setEditingChapter(null);
          setEditContent("");
        } else if (showVersionHistory) {
          setShowVersionHistory(false);
        } else if (showShareModal) {
          setShowShareModal(false);
        } else if (showDataSourceDrawer) {
          setShowDataSourceDrawer(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingChapter,
    showVersionHistory,
    showShareModal,
    showDataSourceDrawer,
  ]);

  const handleEditChapter = (chapterId: string) => {
    const chapter = narrative.chapters.find(
      (c) => c.id === chapterId,
    );
    if (chapter) {
      setEditingChapter(chapterId);
      setEditContent(chapter.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editingChapter) return;

    setNarrative((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === editingChapter
          ? {
              ...chapter,
              content: editContent,
              isEdited: true,
              wordCount: editContent.split(" ").length,
            }
          : chapter,
      ),
    }));

    setEditingChapter(null);
    setEditContent("");
    toast.success("Chapter updated", { duration: 2000 });
  };

  const handleRegenerateChapter = (chapterId: string) => {
    toast.success("Chapter regenerated", { duration: 2000 });
  };

  const handleGoalClick = (goal: Goal) => {
    if (goal.completed) return;

    if (goal.chatId) {
      toast.success(`Opening chat: ${goal.title}`, {
        duration: 2000,
      });
    }
  };

  const handleToggleGoalComplete = (goalId: string) => {
    setNarrative((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, completed: !goal.completed }
          : goal,
      ),
    }));
    toast.success("Goal status updated", { duration: 2000 });
  };

  const handleFeedback = (type: "helpful" | "needs-work") => {
    setFeedback((prev) => ({ ...prev, narrative: type }));
    toast.success(
      `Feedback recorded: ${type === "helpful" ? "Helpful" : "Needs work"}`,
      { duration: 2000 },
    );
  };

  const handleMuteUpdates = () => {
    setIsMuted(!isMuted);
    toast.success(
      isMuted
        ? "Narrative updates enabled"
        : "Narrative updates muted for 30 days",
      { duration: 2000 },
    );
  };

  const handleComment = () => {
    if (userComment.trim()) {
      toast.success("Comment saved as fragment", {
        duration: 2000,
      });
      setUserComment("");
      setShowCommentBox(false);
    }
  };

  const handleShare = (format: "png" | "text") => {
    if (format === "png") {
      toast.success("PNG copied to clipboard 📋", {
        duration: 2000,
      });
    } else {
      navigator.clipboard.writeText(narrative.headline);
      toast.success("Headline copied 📋", { duration: 2000 });
    }
    setShowShareModal(false);
  };

  const handleDataSourceClick = (source: DataSource) => {
    setSelectedDataSource(source);
    setShowDataSourceDrawer(true);
  };

  const handleChangeClick = (change: any) => {
    // Navigate to the relevant section
    if (change.target === "values") {
      valuesRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (change.target === "direction") {
      document
        .getElementById("direction")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (change.target === "stakeholder-goal") {
      goalsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    toast.success("Navigating to change", { duration: 1500 });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const renderValueHighlights = (
    content: string,
    highlights: Array<{ text: string; value: string }>,
  ) => {
    let result = content;
    highlights.forEach((highlight) => {
      result = result.replace(
        highlight.text,
        `<strong class="text-meld-ink font-medium">${highlight.text}</strong>`,
      );
    });
    return result;
  };

  const getConfidenceColor = () => {
    if (narrative.confidence >= 80)
      return "meld-confidence-bar";
    if (narrative.confidence >= 50) return "bg-meld-sand";
    return "bg-meld-ember";
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "add":
        return <ArrowUp className="w-3 h-3 text-meld-sage" />;
      case "change":
        return <Triangle className="w-3 h-3 text-meld-sand" />;
      default:
        return <Plus className="w-3 h-3 text-meld-ink/60" />;
    }
  };

  const daysUntilUpdate = Math.ceil(
    (narrative.nextUpdateDue.getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
  const isDueToday = daysUntilUpdate === 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex">
        <div className="flex-1 p-8 space-y-8">
          <div className="h-72 bg-gradient-to-br from-meld-sage/20 to-meld-sand/20 rounded-2xl animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="w-60 border-l border-sidebar-border bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-screen">
      {/* Jump Navigation */}
      {showJumpNav && (
        <div className="fixed left-80 top-1/2 -translate-y-1/2 z-50">
          <div className="bg-white/90 backdrop-blur-sm border border-meld-ink/10 rounded-lg p-2 shadow-lg">
            <div className="text-xs text-meld-ink/60 mb-2 px-2">
              Jump to:
            </div>
            <div className="space-y-1">
              {[
                { id: "values", label: "Values" },
                { id: "momentum", label: "Momentum" },
                { id: "goals", label: "Goals" },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                    activeSection === section.id
                      ? "bg-meld-sand text-meld-ink"
                      : "text-meld-ink/70 hover:bg-meld-graysmoke/50",
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zone A: Narrative Scroll (760px) */}
      <div className="flex-1">
        <ScrollArea className="h-screen" ref={scrollRef}>
          <div className="p-8 pb-16">
            {/* Hero Block - Reduced height by 25% */}
            <div
              ref={heroRef}
              id="hero"
              className="relative h-72 rounded-2xl mb-12 flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor:
                  valueColors[narrative.dominantValue],
              }}
            >
              {/* Watercolor illustration background */}
              <div className="absolute inset-0 meld-trophy-watercolor opacity-30"></div>

              {/* Subtle landscape illustration with animation */}
              <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 meld-landscape-animation">
                <svg
                  viewBox="0 0 760 128"
                  className="w-full h-full"
                >
                  <path
                    d="M0,128 L0,80 Q190,40 380,60 T760,45 L760,128 Z"
                    fill="currentColor"
                    className="text-meld-ink"
                  />
                  <path
                    d="M0,128 L0,95 Q190,60 380,75 T760,65 L760,128 Z"
                    fill="currentColor"
                    className="text-meld-ink opacity-50"
                  />
                </svg>
              </div>

              {/* Updated timestamp in corner */}
              <div className="absolute top-4 right-4">
                <span className="text-xs text-meld-ink/50 uppercase tracking-wide">
                  Updated •{" "}
                  {narrative.lastUpdated.toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>

              {/* Hero content */}
              <div className="relative z-10 text-center max-w-2xl px-8">
                <div className="mb-6">
                  {/* Interactive Value Crest */}
                  <div
                    className="relative w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-transform hover:scale-105"
                    onMouseEnter={() => setShowValueCrest(true)}
                    onMouseLeave={() =>
                      setShowValueCrest(false)
                    }
                  >
                    <Target
                      className="w-8 h-8 text-meld-ink/70"
                      strokeWidth={1.5}
                    />

                    {/* Value Crest Tooltip */}
                    {showValueCrest && (
                      <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-64 z-20">
                        <div className="text-xs text-meld-ink/60 mb-2">
                          Why this headline?
                        </div>
                        <div className="space-y-2">
                          {mockValueProfile.map(
                            (value, index) => {
                              const Icon = value.icon;
                              return (
                                <div
                                  key={value.name}
                                  className="flex items-center gap-2"
                                >
                                  <Icon className="w-4 h-4 text-meld-ink/60" />
                                  <span className="text-sm text-meld-ink font-medium flex-1">
                                    {value.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-2 bg-meld-graysmoke rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${value.percentage}%`,
                                          backgroundColor:
                                            value.color,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-meld-ink/60 w-8">
                                      {value.percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <h1 className="font-serif text-3xl leading-tight text-meld-ink mb-4">
                  {narrative.headline}
                </h1>
                <p className="text-meld-ink/70 text-lg">
                  North-Star Narrative
                </p>
              </div>
            </div>

            {/* Three-Chapter Prose */}
            <div className="space-y-12 mb-8">
              {narrative.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="prose-section"
                  id={chapter.id}
                  ref={
                    index === 0
                      ? valuesRef
                      : index === 1
                        ? momentumRef
                        : undefined
                  }
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl text-meld-ink">
                      {index + 1}. {chapter.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      {chapter.isEdited && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edited
                        </Badge>
                      )}
                    </div>
                  </div>

                  {editingChapter === chapter.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editContent}
                        onChange={(e) =>
                          setEditContent(e.target.value)
                        }
                        className="min-h-32 text-base leading-relaxed border-meld-sand focus:border-meld-sage"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="bg-meld-sage hover:bg-meld-sage/90 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingChapter(null)
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <div
                        className="text-base leading-relaxed text-meld-ink mb-4"
                        dangerouslySetInnerHTML={{
                          __html: renderValueHighlights(
                            chapter.content,
                            chapter.valueHighlights,
                          ),
                        }}
                      />

                      {/* Edit controls */}
                      <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleEditChapter(chapter.id)
                            }
                            className="text-meld-ink/60 hover:text-meld-ink p-2 h-auto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRegenerateChapter(
                                chapter.id,
                              )
                            }
                            className="text-meld-ink/60 hover:text-meld-ink p-2 h-auto"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pull quote for momentum section */}
                  {chapter.id === "momentum" && (
                    <div className="my-6 p-4 bg-meld-graysmoke/50 rounded-lg border-l-4 border-meld-sage">
                      <p className="text-meld-ink/80 italic">
                        "Morning deep-dives have become a
                        cornerstone practice, creating space for
                        strategic thinking before tactical
                        demands take over."
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Goal Alignment Table */}
            <div className="mb-12" id="goals" ref={goalsRef}>
              <h2 className="font-serif text-xl text-meld-ink mb-6">
                Goal Alignment
              </h2>
              <div className="bg-white rounded-lg border border-meld-ink/10 overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-4 bg-meld-graysmoke/30 border-b border-meld-ink/10">
                  <div className="font-medium text-meld-ink">
                    Goal
                  </div>
                  <div className="font-medium text-meld-ink">
                    Alignment
                  </div>
                  <div className="font-medium text-meld-ink">
                    Next step
                  </div>
                </div>
                {narrative.goals.map((goal, index) => {
                  const AlignmentIcon =
                    alignmentConfig[goal.alignment].icon;

                  return (
                    <div
                      key={goal.id}
                      className={cn(
                        "grid grid-cols-3 gap-4 p-4 transition-colors cursor-pointer border-b border-meld-ink/5 last:border-b-0 meld-goal-table-row",
                        index % 2 === 1 && "bg-meld-canvas", // Alternate row shading
                        goal.completed && "opacity-50",
                      )}
                      onClick={() => handleGoalClick(goal)}
                    >
                      <div
                        className={cn(
                          "text-meld-ink",
                          goal.completed && "line-through",
                        )}
                      >
                        {goal.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGoalComplete(goal.id);
                          }}
                          className={cn(
                            "text-xs h-auto p-1 transition-colors meld-alignment-badge",
                            alignmentConfig[goal.alignment]
                              .color,
                            goal.completed &&
                              "bg-meld-sage text-white",
                          )}
                        >
                          {goal.completed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete
                            </>
                          ) : (
                            <>
                              <AlignmentIcon className="w-3 h-3 mr-1" />
                              {
                                alignmentConfig[goal.alignment]
                                  .label
                              }
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-meld-ink/70">
                          {goal.nextStep}
                        </span>
                        {goal.chatId && !goal.completed && (
                          <ArrowRight className="w-4 h-4 text-meld-sage" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Call-to-Action Strip - Enhanced */}
            <div
              className={cn(
                "meld-cta-strip rounded-lg p-6",
                isDueToday && "bg-meld-ember border-meld-ember",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-meld-ink/70 mb-2">
                    {isDueToday
                      ? "Reflection due today"
                      : `Next Deep Dive due in ${daysUntilUpdate} days`}
                  </p>
                  <Button
                    className={cn(
                      "text-white transition-all hover:scale-105",
                      isDueToday
                        ? "bg-meld-rust hover:bg-meld-rust/90"
                        : "bg-meld-sand hover:bg-meld-sand/90 text-meld-ink",
                    )}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Start Reflection
                  </Button>
                </div>
                <div className="flex gap-3">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share headline
                    </Button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-meld-charcoal text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        Copy text | Save image
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <History className="w-4 h-4 mr-2" />
                        History
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs"
                        >
                          v3
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-96"
                    >
                      <div className="p-2">
                        <div className="text-sm font-medium mb-2">
                          Recent Versions
                        </div>
                        {mockVersionHistory
                          .slice(0, 3)
                          .map((version, index) => (
                            <div
                              key={version.id}
                              className="p-2 hover:bg-meld-graysmoke/50 rounded cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-meld-ink/60">
                                  {version.date.toLocaleDateString()}
                                </span>
                                <Badge
                                  variant={
                                    index === 0
                                      ? "default"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {index === 0
                                    ? "Current"
                                    : `v${mockVersionHistory.length - index}`}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-meld-ink line-clamp-2">
                                "{version.headline}"
                              </p>
                            </div>
                          ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowVersionHistory(true)
                          }
                          className="w-full mt-2"
                        >
                          View all versions
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Zone B: Insight Rail (240px) - Now Sticky */}
      <div className="w-60 border-l border-sidebar-border bg-meld-graysmoke/20 meld-insight-rail">
        <div className="p-4 space-y-6">
          {/* Data Sources */}
          <div>
            <h3 className="font-medium text-meld-ink mb-3">
              Data Sources
            </h3>
            <div className="space-y-2">
              {narrative.dataSources.map((source) => {
                const icons = {
                  reflection: FileText,
                  fragment: Zap,
                  win: Target,
                  chat: MessageCircle,
                };
                const Icon = icons[source.type];

                return (
                  <button
                    key={source.id}
                    onClick={() =>
                      handleDataSourceClick(source)
                    }
                    className="w-full text-left p-2 rounded-lg hover:bg-white/50 transition-colors meld-data-source-chip"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className="w-4 h-4 text-meld-ink/60"
                        strokeWidth={1.25}
                      />
                      <span className="text-sm text-meld-ink font-medium">
                        {source.title}
                      </span>
                      {source.count && (
                        <Badge
                          variant="outline"
                          className="text-xs ml-auto"
                        >
                          {source.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-meld-ink/60">
                      {source.date.toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Enhanced Confidence Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-meld-ink">
                Confidence
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-meld-ink/70">
                  {narrative.confidence}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShowConfidenceFactors(
                      !showConfidenceFactors,
                    )
                  }
                  className="p-1 h-auto"
                >
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      showConfidenceFactors && "rotate-180",
                    )}
                  />
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "h-2 rounded-full overflow-hidden",
                getConfidenceColor(),
              )}
            >
              <div
                className="h-full transition-all"
                style={{ width: `${narrative.confidence}%` }}
              />
            </div>
            <p className="text-xs text-meld-ink/60 mt-2">
              Based on last 45 days of activity
            </p>

            {showConfidenceFactors && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Coverage</span>
                  <span>
                    {narrative.confidenceFactors.coverage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Consistency</span>
                  <span>
                    {narrative.confidenceFactors.consistency}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recency</span>
                  <span>
                    {narrative.confidenceFactors.recency}%
                  </span>
                </div>
                <div className="flex justify-between text-meld-ember">
                  <span>Conflicting signals</span>
                  <span>
                    {narrative.confidenceFactors.conflicting}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-2 bg-meld-graysmoke rounded-full" />

          {/* Enhanced What Changed */}
          <div>
            <h3 className="font-medium text-meld-ink mb-3">
              What Changed
            </h3>
            <div className="space-y-2">
              {narrative.changes.map((change, index) => (
                <button
                  key={index}
                  onClick={() => handleChangeClick(change)}
                  className="w-full text-left text-sm text-meld-ink/70 flex items-start gap-2 p-2 rounded hover:bg-white/50 transition-colors"
                >
                  {getChangeIcon(change.type)}
                  <span className="flex-1">{change.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-2 bg-meld-graysmoke rounded-full" />

          {/* Enhanced Feedback */}
          <div>
            <h3 className="font-medium text-meld-ink mb-3">
              Feedback
            </h3>
            <div className="flex gap-2 mb-3">
              <Button
                variant={
                  feedback.narrative === "helpful"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleFeedback("helpful")}
                className={cn(
                  "flex-1 meld-feedback-button",
                  feedback.narrative === "helpful" &&
                    "bg-meld-sage text-white",
                )}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful
              </Button>
              <Button
                variant={
                  feedback.narrative === "needs-work"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleFeedback("needs-work")}
                className={cn(
                  "flex-1 meld-feedback-button",
                  feedback.narrative === "needs-work" &&
                    "bg-meld-ember text-white",
                )}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Needs work
              </Button>
            </div>

            <div className="flex gap-2 mb-3">
              {!showCommentBox ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentBox(true)}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comment
                </Button>
              ) : (
                <div className="space-y-2 meld-comment-box w-full">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={userComment}
                    onChange={(e) =>
                      setUserComment(e.target.value)
                    }
                    className="min-h-16 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleComment}
                      className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCommentBox(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleMuteUpdates}
                className={cn(
                  "transition-colors",
                  isMuted && "bg-meld-ember/20 text-meld-ember",
                )}
                title={
                  isMuted
                    ? "Enable updates"
                    : "Mute updates for 30 days"
                }
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Drawer */}
      <Drawer
        open={showDataSourceDrawer}
        onOpenChange={setShowDataSourceDrawer}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {selectedDataSource?.title}
            </DrawerTitle>
            <DrawerDescription>
              {selectedDataSource?.type} from{" "}
              {selectedDataSource?.date.toLocaleDateString()}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-meld-ink/70">
              {selectedDataSource?.preview}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm">
                Open in {selectedDataSource?.type}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataSourceDrawer(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Version History Modal */}
      <Dialog
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Narrative History</DialogTitle>
            <DialogDescription>
              Previous versions of your North-Star Narrative
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {mockVersionHistory.map((version, index) => (
              <div
                key={version.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        index === 0 ? "default" : "outline"
                      }
                    >
                      {index === 0
                        ? "Current"
                        : `Version ${mockVersionHistory.length - index}`}
                    </Badge>
                    <span className="text-sm text-meld-ink/60">
                      {version.date.toLocaleDateString()}
                    </span>
                    <span className="text-xs text-meld-ink/60">
                      {version.confidence}% confidence
                    </span>
                  </div>
                </div>
                <h4 className="font-serif font-medium text-meld-ink mb-2">
                  "{version.headline}"
                </h4>
                <div className="text-sm text-meld-ink/70">
                  <p className="mb-1">Changes:</p>
                  <ul className="space-y-1">
                    {version.changes.map((change, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2"
                      >
                        <span className="text-meld-sage">
                          •
                        </span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Share Modal */}
      <Dialog
        open={showShareModal}
        onOpenChange={setShowShareModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Headline</DialogTitle>
            <DialogDescription>
              Share your North-Star headline with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="meld-share-preview-card rounded-lg p-4">
              <p className="font-serif text-meld-ink italic">
                "{narrative.headline}"
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleShare("text")}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Text
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("png")}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-2" />
                Save Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
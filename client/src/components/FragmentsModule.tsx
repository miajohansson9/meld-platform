import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  Search,
  Mic,
  Image,
  Globe,
  Quote,
  Hash,
  Calendar,
  Target,
  FileText,
  Star,
  Tag,
  Trash2,
  MoreHorizontal,
  X,
  Send,
  Download,
  Edit3,
  Bookmark,
  MessageSquare,
  Archive,
  Filter,
  Grid3X3,
  List,
  Lightbulb,
  HelpCircle,
  Volume2,
  Camera,
  Link,
  Sparkles,
  ArrowRight,
  Circle,
  Eye,
  Copy,
  Share,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from './ui/utils';
import { toast } from 'sonner';

interface Fragment {
  id: string;
  content: string;
  type: 'quote' | 'insight' | 'question' | 'todo' | 'general';
  timestamp: Date;
  source: 'manual' | 'voice' | 'web' | 'import';
  tags: string[];
  isPinned: boolean;
  wordCount: number;
  clusterId?: string;
  sourceUrl?: string;
  sourceIcon?: React.ReactNode;
}

interface Cluster {
  id: string;
  label: string;
  fragmentCount: number;
  changePercent: number;
  color: string;
  fragments: Fragment[];
}

const typeConfig = {
  quote: {
    color: '#F2DBDB', // rose
    label: 'Quote',
    dotColor: '#D4A4A4'
  },
  insight: {
    color: '#E9F2E4', // sage
    label: 'Insight',
    dotColor: '#BFCDB1'
  },
  question: {
    color: '#F1ECD9', // sand
    label: 'Question',
    dotColor: '#D5C8A4'
  },
  todo: {
    color: '#DFE4E7', // stone
    label: 'TODO',
    dotColor: '#A8B2B8'
  },
  general: {
    color: '#F9F8F5', // canvas
    label: 'Note',
    dotColor: '#C5C4C1'
  }
};

const mockFragments: Fragment[] = [
  {
    id: '1',
    content: '"The best way to find out if you can trust somebody is to trust them." - Ernest Hemingway',
    type: 'quote',
    timestamp: new Date('2025-06-29T14:30:00'),
    source: 'web',
    tags: ['trust', 'relationships'],
    isPinned: false,
    wordCount: 16,
    sourceUrl: 'https://example.com',
    sourceIcon: <Globe className="w-3 h-3" />
  },
  {
    id: '2',
    content: 'I realized that I\'ve been avoiding difficult conversations because I\'m afraid of conflict. But avoiding them creates more problems.',
    type: 'insight',
    timestamp: new Date('2025-06-29T12:15:00'),
    source: 'manual',
    tags: ['communication', 'growth'],
    isPinned: true,
    wordCount: 22,
    clusterId: 'communication'
  },
  {
    id: '3',
    content: 'How can I better balance being supportive of my team while still maintaining high standards?',
    type: 'question',
    timestamp: new Date('2025-06-29T10:45:00'),
    source: 'voice',
    tags: ['leadership', 'management'],
    isPinned: false,
    wordCount: 15,
    sourceIcon: <Mic className="w-3 h-3" />,
    clusterId: 'leadership'
  },
  {
    id: '4',
    content: 'Schedule time tomorrow to review the project timeline and identify potential bottlenecks.',
    type: 'todo',
    timestamp: new Date('2025-06-28T16:20:00'),
    source: 'manual',
    tags: ['project', 'planning'],
    isPinned: false,
    wordCount: 12
  },
  {
    id: '5',
    content: 'The energy in the room completely shifted when we started focusing on solutions instead of problems.',
    type: 'insight',
    timestamp: new Date('2025-06-28T11:30:00'),
    source: 'manual',
    tags: ['meetings', 'positivity'],
    isPinned: false,
    wordCount: 16,
    clusterId: 'communication'
  }
];

const mockClusters: Cluster[] = [
  {
    id: 'communication',
    label: 'Communication',
    fragmentCount: 8,
    changePercent: 25,
    color: '#E9F2E4',
    fragments: mockFragments.filter(f => f.clusterId === 'communication')
  },
  {
    id: 'leadership',
    label: 'Leadership',
    fragmentCount: 5,
    changePercent: -10,
    color: '#F1ECD9',
    fragments: mockFragments.filter(f => f.clusterId === 'leadership')
  },
  {
    id: 'growth',
    label: 'Personal Growth',
    fragmentCount: 12,
    changePercent: 40,
    color: '#F2DBDB',
    fragments: mockFragments.filter(f => f.tags.includes('growth'))
  },
  {
    id: 'productivity',
    label: 'Productivity',
    fragmentCount: 3,
    changePercent: 0,
    color: '#DFE4E7',
    fragments: []
  }
];

export function FragmentsModule() {
  const [activeView, setActiveView] = useState<'inbox' | 'themes'>('inbox');
  const [fragments, setFragments] = useState<Fragment[]>(mockFragments);
  const [selectedFragments, setSelectedFragments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showWeave, setShowWeave] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [captureText, setCaptureText] = useState('');
  const [weaveTitle, setWeaveTitle] = useState('');
  const [weaveContent, setWeaveContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLTextAreaElement>(null);

  const filteredFragments = fragments.filter(fragment =>
    fragment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fragment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⇧F for quick capture
      if (e.metaKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowQuickCapture(true);
      }
      
      // ⌘F for search
      if (e.metaKey && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // ⌘2 for themes
      if (e.metaKey && e.key === '2') {
        e.preventDefault();
        setActiveView('themes');
      }

      // ⌘1 for inbox
      if (e.metaKey && e.key === '1') {
        e.preventDefault();
        setActiveView('inbox');
      }

      // J/K navigation in inbox
      if (activeView === 'inbox' && !showQuickCapture && !showWeave) {
        if (e.key === 'j' || e.key === 'k') {
          e.preventDefault();
          const direction = e.key === 'j' ? 1 : -1;
          const newIndex = Math.max(0, Math.min(filteredFragments.length - 1, highlightedIndex + direction));
          setHighlightedIndex(newIndex);
          setSelectedFragment(filteredFragments[newIndex] || null);
        }
      }

      // Space for multi-select
      if (e.key === ' ' && highlightedIndex >= 0 && !showQuickCapture && !showWeave) {
        e.preventDefault();
        const fragmentId = filteredFragments[highlightedIndex]?.id;
        if (fragmentId) {
          handleFragmentSelect(fragmentId);
        }
      }

      // ⌘E for weave
      if (e.metaKey && e.key === 'e' && selectedFragments.length > 0) {
        e.preventDefault();
        handleOpenWeave();
      }

      // Escape to clear selection/close modals
      if (e.key === 'Escape') {
        if (showWeave) {
          setShowWeave(false);
        } else if (showQuickCapture) {
          setShowQuickCapture(false);
        } else {
          setSelectedFragments([]);
          setHighlightedIndex(-1);
          setSelectedFragment(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, highlightedIndex, filteredFragments, selectedFragments, showQuickCapture, showWeave]);

  const detectFragmentType = (content: string): Fragment['type'] => {
    if (content.includes('"') || content.includes("'")) return 'quote';
    if (content.endsWith('?')) return 'question';
    if (content.toLowerCase().includes('tomorrow') || content.toLowerCase().includes('next') || 
        content.toLowerCase().startsWith('schedule') || content.toLowerCase().startsWith('call') ||
        content.toLowerCase().startsWith('email')) return 'todo';
    if (content.toLowerCase().includes('i realized') || content.toLowerCase().includes('i learned') ||
        content.toLowerCase().includes('insight')) return 'insight';
    return 'general';
  };

  const handleQuickCapture = () => {
    if (!captureText.trim()) return;

    const newFragment: Fragment = {
      id: Date.now().toString(),
      content: captureText,
      type: detectFragmentType(captureText),
      timestamp: new Date(),
      source: 'manual',
      tags: [],
      isPinned: false,
      wordCount: captureText.split(' ').length
    };

    setFragments(prev => [newFragment, ...prev]);
    setCaptureText('');
    setShowQuickCapture(false);
    toast.success('Fragment captured', { duration: 2000 });
  };

  const handleFragmentSelect = (fragmentId: string) => {
    setSelectedFragments(prev => 
      prev.includes(fragmentId) 
        ? prev.filter(id => id !== fragmentId)
        : [...prev, fragmentId]
    );
  };

  const handleDeleteFragment = (fragmentId: string) => {
    setFragments(prev => prev.filter(f => f.id !== fragmentId));
    setSelectedFragments(prev => prev.filter(id => id !== fragmentId));
    toast.success('Fragment deleted', { duration: 2000 });
  };

  const handlePinFragment = (fragmentId: string) => {
    setFragments(prev => prev.map(f => 
      f.id === fragmentId ? { ...f, isPinned: !f.isPinned } : f
    ));
    toast.success('Fragment pinned', { duration: 2000 });
  };

  const handleOpenWeave = () => {
    if (selectedFragments.length === 0) return;
    
    const selectedFragmentObjects = fragments.filter(f => selectedFragments.includes(f.id));
    const autoTitle = `Reflection on ${selectedFragmentObjects[0]?.tags[0] || 'fragments'}`;
    const autoOutline = `# ${autoTitle}\n\n• Theme 1: ${selectedFragmentObjects[0]?.tags[0] || 'Key insight'}\n• Theme 2: Patterns and connections\n• Theme 3: Next steps\n\n`;
    
    setWeaveTitle(autoTitle);
    setWeaveContent(autoOutline);
    setShowWeave(true);
  };

  const handleWeaveExport = (destination: 'reflection' | 'markdown' | 'chat') => {
    const exportData = {
      title: weaveTitle,
      content: weaveContent,
      fragmentIds: selectedFragments,
      destination
    };
    
    toast.success(`Exported to ${destination}`, { duration: 2000 });
    setShowWeave(false);
    setSelectedFragments([]);
  };

  const handleClusterClick = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setActiveView('inbox');
    setSearchQuery(''); // Show cluster fragments
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-meld-sand/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-meld-rose/30 rounded rotate-12"></div>
          <div className="absolute -top-1 right-2 w-4 h-5 bg-meld-sage/30 rounded rotate-45"></div>
          <div className="absolute bottom-1 -left-1 w-5 h-4 bg-meld-sand/40 rounded -rotate-12"></div>
          <Lightbulb className="w-12 h-12 text-meld-sand" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl text-meld-ink mb-3">
          Fragments are the small sparks of a bigger story
        </h3>
        <p className="text-meld-ink/70 leading-relaxed mb-6">
          Drop ideas, quotes, worries—Meld will weave them later.
        </p>
        <Button 
          onClick={() => setShowQuickCapture(true)}
          className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink"
        >
          <Plus className="w-4 h-4 mr-2" />
          Quick Fragment (⌘⇧F)
        </Button>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-gray-200 rounded-full mt-2"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInboxView = () => {
    const displayFragments = selectedCluster 
      ? selectedCluster.fragments 
      : filteredFragments;

    if (displayFragments.length === 0 && searchQuery === '' && !selectedCluster) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-4">
        {selectedCluster && (
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCluster(null)}
              className="text-meld-ink/60 hover:text-meld-ink"
            >
              ← Back to all fragments
            </Button>
            <Badge className="bg-meld-sage/20 text-meld-ink border-meld-sage">
              {selectedCluster.label} • {selectedCluster.fragmentCount} fragments
            </Badge>
          </div>
        )}

        {displayFragments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-meld-ink/60">No fragments found</p>
          </div>
        ) : (
          displayFragments.map((fragment, index) => {
            const config = typeConfig[fragment.type];
            const isSelected = selectedFragments.includes(fragment.id);
            const isHighlighted = highlightedIndex === index;

            return (
              <div
                key={fragment.id}
                className={cn(
                  "group bg-white rounded-lg border transition-all duration-200 cursor-pointer",
                  isSelected && "ring-2 ring-meld-sand ring-offset-2",
                  isHighlighted && "ring-2 ring-meld-sage/50 ring-offset-1",
                  !isSelected && !isHighlighted && "border-gray-100 hover:shadow-lg hover:border-gray-200"
                )}
                onClick={() => {
                  setSelectedFragment(fragment);
                  setHighlightedIndex(index);
                }}
                role="article"
                aria-label={`Fragment: ${fragment.content.substring(0, 50)}...`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type dot */}
                    <div 
                      className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: config.dotColor }}
                    />
                    
                    {/* Multi-select checkbox */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleFragmentSelect(fragment.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-meld-ink text-sm leading-relaxed mb-2">
                        {fragment.content.length > 200 
                          ? fragment.content.substring(0, 200) + '...'
                          : fragment.content
                        }
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-meld-ink/60">
                            {fragment.timestamp.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          {fragment.sourceIcon && (
                            <div className="text-meld-ink/40">
                              {fragment.sourceIcon}
                            </div>
                          )}
                          
                          {fragment.isPinned && (
                            <Star className="w-3 h-3 text-meld-sand fill-current" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {fragment.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {fragment.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{fragment.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinFragment(fragment.id);
                        }}
                        className="p-1 h-auto"
                      >
                        <Star className={cn("w-4 h-4", fragment.isPinned ? "fill-current text-meld-sand" : "text-meld-ink/40")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 h-auto text-meld-ink/40 hover:text-meld-ink"
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFragment(fragment.id);
                        }}
                        className="p-1 h-auto text-meld-ink/40 hover:text-meld-ember"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderClusterView = () => (
    <div className="grid grid-cols-2 gap-6 py-8">
      {mockClusters.map((cluster) => {
        const bubbleSize = Math.max(80, Math.min(160, cluster.fragmentCount * 10));
        
        return (
          <div
            key={cluster.id}
            className="relative group cursor-pointer"
            onClick={() => handleClusterClick(cluster)}
          >
            <div
              className="rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg mx-auto"
              style={{
                width: bubbleSize,
                height: bubbleSize,
                backgroundColor: cluster.color,
                border: `2px solid ${cluster.color}`
              }}
            >
              <div className="text-center">
                <h3 className="font-medium text-meld-ink text-sm mb-1">
                  {cluster.label}
                </h3>
                <p className="text-xs text-meld-ink/70">
                  {cluster.fragmentCount} fragments
                </p>
              </div>
            </div>
            
            {/* Hover info */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-lg">
                <p className="text-xs text-meld-ink/70">
                  {cluster.changePercent > 0 ? '+' : ''}{cluster.changePercent}% last 30d
                </p>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Add new cluster placeholder */}
      <div className="relative group cursor-pointer opacity-50 hover:opacity-70 transition-opacity">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-meld-ink/20 flex items-center justify-center mx-auto">
          <Plus className="w-6 h-6 text-meld-ink/40" />
        </div>
        <p className="text-xs text-meld-ink/60 text-center mt-2">New theme</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex">
        {/* Zone A: Capture Rail Skeleton */}
        <div className="w-60 border-r border-sidebar-border bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Zone B: Canvas Skeleton */}
        <div className="flex-1 max-w-3xl p-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {renderSkeleton()}
        </div>

        {/* Zone C: Detail Rail Skeleton */}
        <div className="w-60 border-l border-sidebar-border bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Zone A: Capture Rail (240px) */}
      <div className="w-60 border-r border-sidebar-border bg-meld-graysmoke/20 flex flex-col">
        <div className="p-4 space-y-4">
          {/* Quick Capture Button */}
          <Button
            onClick={() => setShowQuickCapture(true)}
            className="w-full bg-meld-sand hover:bg-meld-sand/90 text-meld-ink justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Fragment
            <span className="ml-auto text-xs opacity-70">⌘⇧F</span>
          </Button>

          <div className="border-t border-sidebar-border pt-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice note
              <span className="ml-auto text-xs">90s</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
            >
              <Image className="w-4 h-4 mr-2" />
              Image drop
              <span className="ml-auto text-xs">OCR</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
            >
              <Globe className="w-4 h-4 mr-2" />
              Web clip
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowQuickCapture(true);
                setCaptureText('"What struck you?"');
              }}
              className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
            >
              <Quote className="w-4 h-4 mr-2" />
              Quote prompt
            </Button>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <h4 className="text-xs font-medium text-meld-ink/70 mb-2">Shortcuts</h4>
          <div className="space-y-1 text-xs text-meld-ink/60">
            <div className="flex justify-between">
              <span>Search</span>
              <span>⌘F</span>
            </div>
            <div className="flex justify-between">
              <span>Navigate</span>
              <span>J/K</span>
            </div>
            <div className="flex justify-between">
              <span>Select</span>
              <span>Space</span>
            </div>
            <div className="flex justify-between">
              <span>Weave</span>
              <span>⌘E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone B: Fragment Canvas (760px) */}
      <div className="flex-1 max-w-3xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-2xl text-meld-ink">Fragments</h1>
            
            {selectedFragments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-meld-ink/70">
                  {selectedFragments.length} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleOpenWeave}
                  className="bg-meld-sage hover:bg-meld-sage/90 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Weave
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFragments([])}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-meld-ink/40" />
            <Input
              ref={searchInputRef}
              placeholder="Search fragments and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-meld-ink/20 focus:border-meld-sand"
            />
          </div>

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'inbox' | 'themes')}>
            <TabsList className="grid w-full grid-cols-2 bg-meld-graysmoke/50">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-white">
                <List className="w-4 h-4 mr-2" />
                Inbox
                <span className="ml-2 text-xs">⌘1</span>
              </TabsTrigger>
              <TabsTrigger value="themes" className="data-[state=active]:bg-white">
                <Circle className="w-4 h-4 mr-2" />
                Themes
                <span className="ml-2 text-xs">⌘2</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {activeView === 'inbox' ? renderInboxView() : renderClusterView()}
          </div>
        </ScrollArea>
      </div>

      {/* Zone C: Detail/Preview Rail (240px) */}
      <div className="w-60 border-l border-sidebar-border bg-meld-graysmoke/20 flex flex-col">
        {selectedFragment ? (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-medium text-meld-ink mb-2">Preview</h3>
              <div className="bg-white rounded-lg p-3 border border-meld-ink/10">
                <p className="text-sm text-meld-ink leading-relaxed">
                  {selectedFragment.content}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-meld-ink mb-2">Metadata</h4>
              <div className="space-y-2 text-sm text-meld-ink/70">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{selectedFragment.timestamp.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source</span>
                  <span className="capitalize">{selectedFragment.source}</span>
                </div>
                <div className="flex justify-between">
                  <span>Words</span>
                  <span>{selectedFragment.wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: typeConfig[selectedFragment.type].color,
                      borderColor: typeConfig[selectedFragment.type].dotColor
                    }}
                  >
                    {typeConfig[selectedFragment.type].label}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-meld-ink mb-2">Actions</h4>
              <div className="space-y-2">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add to Chat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presentation">Presentation Debrief</SelectItem>
                    <SelectItem value="north-star">North-Star Review</SelectItem>
                    <SelectItem value="new">New Chat</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Pin to Wins Vault
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedFragments([selectedFragment.id]);
                    handleOpenWeave();
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Merge (Weave)
                </Button>
              </div>
            </div>
          </div>
        ) : selectedFragments.length > 1 ? (
          <div className="p-4">
            <h3 className="font-medium text-meld-ink mb-2">Bulk Actions</h3>
            <p className="text-sm text-meld-ink/70 mb-4">
              {selectedFragments.length} fragments selected
            </p>
            <Button
              onClick={handleOpenWeave}
              className="w-full bg-meld-sage hover:bg-meld-sage/90 text-white"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Weave Together
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-meld-ink/60">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select a fragment to preview</p>
          </div>
        )}
      </div>

      {/* Quick Capture Modal */}
      <Dialog open={showQuickCapture} onOpenChange={setShowQuickCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Fragment</DialogTitle>
            <DialogDescription>
              Capture a quick thought, idea, or note that you can organize later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              ref={captureInputRef}
              placeholder="What's on your mind?"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              className="min-h-24 resize-none border-meld-ink/20 focus:border-meld-sand"
              autoFocus
            />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Link className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickCapture(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickCapture}
                  className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink"
                >
                  Capture
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weave Modal */}
      <Dialog open={showWeave} onOpenChange={setShowWeave}>
        <DialogContent className="sm:max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Weave Fragments</DialogTitle>
            <DialogDescription>
              Combine selected fragments into a cohesive reflection, plan, or document.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-6 h-96">
            {/* Left: Fragment List */}
            <div className="w-1/3 space-y-4">
              <h4 className="font-medium text-meld-ink">Selected Fragments</h4>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {fragments
                    .filter(f => selectedFragments.includes(f.id))
                    .map((fragment) => (
                      <div key={fragment.id} className="p-3 bg-meld-graysmoke/50 rounded-lg text-sm">
                        <p className="text-meld-ink leading-relaxed">
                          {fragment.content.substring(0, 120)}
                          {fragment.content.length > 120 && '...'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: typeConfig[fragment.type].dotColor }}
                          />
                          <span className="text-xs text-meld-ink/60">
                            {typeConfig[fragment.type].label}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Editor */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Reflection title..."
                  value={weaveTitle}
                  onChange={(e) => setWeaveTitle(e.target.value)}
                  className="border-meld-ink/20 focus:border-meld-sand"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                  <Select defaultValue="narrative">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullet">Bullet</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Textarea
                placeholder="Start weaving your fragments together..."
                value={weaveContent}
                onChange={(e) => setWeaveContent(e.target.value)}
                className="h-full resize-none border-meld-ink/20 focus:border-meld-sand"
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowWeave(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleWeaveExport('markdown')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Markdown
              </Button>
              <Button
                variant="outline"
                onClick={() => handleWeaveExport('chat')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send to Chat
              </Button>
              <Button
                onClick={() => handleWeaveExport('reflection')}
                className="bg-meld-sage hover:bg-meld-sage/90 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Send to Reflection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  Star,
  Trophy,
  Calendar,
  Tag,
  Link,
  Copy,
  Download,
  Share,
  Image,
  Edit3,
  MoreHorizontal,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  FileText,
  Camera,
  Sparkles,
  ArrowRight,
  Pin,
  Heart,
  Target,
  Zap,
  Award,
  Crown,
  Gem,
  X,
  ChevronDown,
  ExternalLink,
  Bookmark,
  MessageSquare
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

interface WinTile {
  id: string;
  title: string;
  date: Date;
  tags: string[];
  source: 'log' | 'chat' | 'manual' | 'fragment';
  sourceId?: string;
  thumbnail?: string;
  emoji?: string;
  description?: string;
  impact: string[];
  isPinned: boolean;
  isShared: boolean;
  shareCount: number;
  originalContent?: string;
}

interface MonthlyDigest {
  month: string;
  year: number;
  tileCount: number;
  isReady: boolean;
  previewTiles: WinTile[];
}

const sourceConfig = {
  log: {
    icon: FileText,
    label: 'Log Entry',
    color: 'var(--meld-sage)'
  },
  chat: {
    icon: MessageSquare,
    label: 'Chat Thread',
    color: 'var(--meld-sand)'
  },
  manual: {
    icon: Edit3,
    label: 'Manual Entry',
    color: 'var(--meld-ink)'
  },
  fragment: {
    icon: Zap,
    label: 'Fragment',
    color: 'var(--meld-rose)'
  }
};

const mockWinTiles: WinTile[] = [
  {
    id: '1',
    title: 'Story Presentation Success',
    date: new Date('2025-06-28T14:30:00'),
    tags: ['Growth', 'Speaking'],
    source: 'log',
    sourceId: 'log-1',
    emoji: '🎯',
    description: 'Delivered the quarterly story with confidence and got great feedback',
    impact: ['Increased team confidence', 'Improved stakeholder buy-in', 'Personal breakthrough in public speaking'],
    isPinned: true,
    isShared: false,
    shareCount: 0,
    originalContent: 'Today I presented our quarterly story to the leadership team...'
  },
  {
    id: '2',
    title: 'Difficult Conversation Win',
    date: new Date('2025-06-26T10:15:00'),
    tags: ['Communication', 'Leadership'],
    source: 'chat',
    sourceId: 'chat-1',
    emoji: '💬',
    description: 'Successfully navigated a challenging team conversation about project priorities',
    impact: ['Team alignment achieved', 'Conflict resolved constructively', 'Trust building moment'],
    isPinned: false,
    isShared: true,
    shareCount: 2,
    originalContent: 'Had that difficult conversation with the team about priorities...'
  },
  {
    id: '3',
    title: 'Mentorship Milestone',
    date: new Date('2025-06-24T16:45:00'),
    tags: ['Growth', 'Mentoring'],
    source: 'fragment',
    sourceId: 'fragment-1',
    emoji: '🌱',
    description: 'Helped junior team member breakthrough on complex problem',
    impact: ['Knowledge transfer success', 'Team member growth', 'Leadership development'],
    isPinned: false,
    isShared: false,
    shareCount: 0,
    originalContent: 'I realized today that mentoring isn\'t just about giving advice...'
  },
  {
    id: '4',
    title: 'Process Improvement Win',
    date: new Date('2025-06-22T11:20:00'),
    tags: ['Process', 'Innovation'],
    source: 'manual',
    emoji: '⚡',
    description: 'Streamlined the weekly planning process, saving 2 hours per week',
    impact: ['Time savings for team', 'Improved focus on priorities', 'Reduced meeting fatigue'],
    isPinned: false,
    isShared: false,
    shareCount: 0
  },
  {
    id: '5',
    title: 'Client Relationship Breakthrough',
    date: new Date('2025-06-20T09:30:00'),
    tags: ['Client', 'Relationship'],
    source: 'log',
    sourceId: 'log-2',
    emoji: '🤝',
    description: 'Turned around a challenging client relationship through consistent communication',
    impact: ['Client satisfaction improved', 'Contract renewal secured', 'Trust rebuilt'],
    isPinned: true,
    isShared: true,
    shareCount: 5,
    originalContent: 'The client meeting went better than expected...'
  }
];

const mockMonthlyDigest: MonthlyDigest = {
  month: 'June',
  year: 2025,
  tileCount: 12,
  isReady: true,
  previewTiles: mockWinTiles.slice(0, 3)
};

const mockSuggestions = [
  {
    id: 'log-suggest-1',
    type: 'log',
    title: 'Weekly reflection starred',
    content: 'You starred "Breakthrough in stakeholder communication" - add to Wins?',
    action: 'Create Tile'
  },
  {
    id: 'chat-suggest-1',
    type: 'chat',
    title: 'Chat thread pinned',
    content: 'You pinned the "Leadership feedback" conversation - capture the win?',
    action: 'Create Tile'
  },
  {
    id: 'fragment-suggest-1',
    type: 'fragment',
    title: 'Breakthrough tagged',
    content: 'Fragment cluster tagged "Breakthrough" - create a Win tile?',
    action: 'Create Tile'
  }
];

export function WinsVaultModule() {
  const [activeView, setActiveView] = useState<'gallery' | 'timeline'>('gallery');
  const [winTiles, setWinTiles] = useState<WinTile[]>(mockWinTiles);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState<WinTile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showNewTileModal, setShowNewTileModal] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTile, setNewTile] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    impact: ['', '', ''],
    emoji: '🎯'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const allTags = ['all', ...Array.from(new Set(winTiles.flatMap(tile => tile.tags)))];
  const filteredTiles = winTiles.filter(tile => {
    const matchesSearch = tile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tile.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || tile.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Sort tiles by date (newest first)
  const sortedTiles = [...filteredTiles].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⌥W for new win tile
      if (e.metaKey && e.altKey && e.key === 'w') {
        e.preventDefault();
        setShowNewTileModal(true);
      }
      
      // ⇧Space to toggle view
      if (e.shiftKey && e.key === ' ') {
        e.preventDefault();
        setActiveView(prev => prev === 'gallery' ? 'timeline' : 'gallery');
      }

      // ⌘F for search
      if (e.metaKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // ⌘↩ for quick share (if tile selected)
      if (e.metaKey && e.key === 'Enter' && selectedTile) {
        e.preventDefault();
        handleQuickShare(selectedTile.id);
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        if (showNewTileModal) {
          setShowNewTileModal(false);
        } else if (showDigestModal) {
          setShowDigestModal(false);
        } else {
          setSelectedTiles([]);
          setSelectedTile(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTile, showNewTileModal, showDigestModal]);

  const handleCreateTile = () => {
    if (!newTile.title.trim()) return;

    const tile: WinTile = {
      id: Date.now().toString(),
      title: newTile.title,
      date: new Date(),
      tags: newTile.tags,
      source: 'manual',
      emoji: newTile.emoji,
      description: newTile.description,
      impact: newTile.impact.filter(i => i.trim()),
      isPinned: false,
      isShared: false,
      shareCount: 0
    };

    setWinTiles(prev => [tile, ...prev]);
    setNewTile({
      title: '',
      description: '',
      tags: [],
      impact: ['', '', ''],
      emoji: '🎯'
    });
    setShowNewTileModal(false);
    
    // Success confetti animation
    toast.success('Win tile created! 🎉', { duration: 3000 });
  };

  const handleTileSelect = (tileId: string) => {
    setSelectedTiles(prev => 
      prev.includes(tileId) 
        ? prev.filter(id => id !== tileId)
        : [...prev, tileId]
    );
  };

  const handleTileClick = (tile: WinTile) => {
    setSelectedTile(tile);
  };

  const handlePinTile = (tileId: string) => {
    setWinTiles(prev => prev.map(tile => 
      tile.id === tileId ? { ...tile, isPinned: !tile.isPinned } : tile
    ));
    toast.success('Tile pinned status updated', { duration: 2000 });
  };

  const handleQuickShare = (tileId: string) => {
    // Copy PNG to clipboard (mock)
    navigator.clipboard.writeText(`Win tile: ${winTiles.find(t => t.id === tileId)?.title}`);
    toast.success('Win tile copied to clipboard', { duration: 2000 });
  };

  const handleExportPDF = () => {
    // Mock PDF export
    toast.success(`Exporting ${selectedTiles.length} tiles to PDF...`, { duration: 3000 });
    setSelectedTiles([]);
  };

  const handleSuggestionAccept = (suggestionId: string) => {
    const suggestion = mockSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      setNewTile({
        title: suggestion.title,
        description: suggestion.content,
        tags: [suggestion.type === 'log' ? 'Growth' : suggestion.type === 'chat' ? 'Communication' : 'Insight'],
        impact: ['', '', ''],
        emoji: suggestion.type === 'log' ? '📝' : suggestion.type === 'chat' ? '💬' : '💡'
      });
      setShowNewTileModal(true);
    }
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-meld-sand/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          {/* Watercolor trophy effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-meld-sand/30 via-meld-sage/20 to-meld-rose/20 rounded-full"></div>
          <Trophy className="w-12 h-12 text-meld-sand relative z-10" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-meld-sage/40 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-meld-rose/30 rounded-full"></div>
        </div>
        <h3 className="font-serif text-xl text-meld-ink mb-3">
          Your wins start here
        </h3>
        <p className="text-meld-ink/70 leading-relaxed mb-6">
          Pin moments from Log or Chats to start your Vault and build evidence of your momentum.
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={() => setShowNewTileModal(true)}
            className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Win Tile
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="text-meld-ink/70 hover:text-meld-ink"
          >
            Go to Log
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWinTile = (tile: WinTile, index: number) => {
    const isSelected = selectedTiles.includes(tile.id);
    const SourceIcon = sourceConfig[tile.source].icon;

    return (
      <div
        key={tile.id}
        className={cn(
          "win-tile-card group bg-white rounded-xl border cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-meld-sand ring-offset-2",
          "hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1"
        )}
        onClick={() => handleTileClick(tile)}
        role="button"
        aria-label={`Win: ${tile.title}, ${tile.date.toLocaleDateString()}`}
        style={{ width: '200px', height: '168px' }}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header with emoji/thumbnail */}
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-meld-sand/20 rounded-lg flex items-center justify-center">
              {tile.emoji ? (
                <span className="text-lg">{tile.emoji}</span>
              ) : (
                <Trophy className="w-4 h-4 text-meld-sand" />
              )}
            </div>
            
            {/* Selection checkbox */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleTileSelect(tile.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif text-sm font-semibold text-meld-ink mb-2 line-clamp-2 leading-tight">
            {tile.title}
          </h3>

          {/* Date and tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-meld-ink/60">
              {tile.date.toLocaleDateString('en-US', { 
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            {tile.tags[0] && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0 h-4 bg-meld-sand/20 text-meld-ink border-meld-sand"
              >
                {tile.tags[0]}
              </Badge>
            )}
          </div>

          {/* Action strip */}
          <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinTile(tile.id);
                }}
                className="p-1 h-auto text-meld-ink/60 hover:text-meld-ink"
              >
                <Pin className={cn("w-4 h-4", tile.isPinned && "fill-current text-meld-sand")} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickShare(tile.id);
                }}
                className="p-1 h-auto text-meld-ink/60 hover:text-meld-ink"
              >
                <Link className="w-4 h-4" />
              </Button>

              <SourceIcon className="w-3 h-3 text-meld-ink/40" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 h-auto text-meld-ink/60 hover:text-meld-ink"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit tile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View source
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Pin indicator */}
          {tile.isPinned && (
            <div className="absolute top-2 left-2">
              <Pin className="w-3 h-3 text-meld-sand fill-current" />
            </div>
          )}

          {/* Share indicator */}
          {tile.isShared && (
            <div className="absolute top-2 right-2">
              <Share className="w-3 h-3 text-meld-sage" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGalleryView = () => {
    if (sortedTiles.length === 0) {
      return searchQuery || selectedTag !== 'all' ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-meld-ink/40 mx-auto mb-4" />
            <p className="text-meld-ink/60">No wins found matching your criteria</p>
          </div>
        </div>
      ) : renderEmptyState();
    }

    return (
      <div className="grid grid-cols-3 gap-6 p-6">
        {sortedTiles.map(renderWinTile)}
      </div>
    );
  };

  const renderTimelineView = () => {
    if (sortedTiles.length === 0) {
      return searchQuery || selectedTag !== 'all' ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-meld-ink/40 mx-auto mb-4" />
            <p className="text-meld-ink/60">No wins found matching your criteria</p>
          </div>
        </div>
      ) : renderEmptyState();
    }

    return (
      <div className="p-6 space-y-4">
        {sortedTiles.map((tile, index) => {
          const SourceIcon = sourceConfig[tile.source].icon;
          
          return (
            <div
              key={tile.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTileClick(tile)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-meld-sand/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  {tile.emoji ? (
                    <span className="text-xl">{tile.emoji}</span>
                  ) : (
                    <Trophy className="w-5 h-5 text-meld-sand" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-lg font-semibold text-meld-ink">
                      {tile.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <SourceIcon className="w-4 h-4 text-meld-ink/40" />
                      <span className="text-sm text-meld-ink/60">
                        {tile.date.toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {tile.description && (
                    <p className="text-meld-ink/70 mb-3 leading-relaxed">
                      {tile.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tile.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {tile.isPinned && (
                        <Pin className="w-4 h-4 text-meld-sand fill-current" />
                      )}
                      {tile.isShared && (
                        <div className="flex items-center gap-1">
                          <Share className="w-4 h-4 text-meld-sage" />
                          <span className="text-xs text-meld-ink/60">{tile.shareCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {tile.originalContent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-meld-sage hover:text-meld-sage/80"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View source
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex">
        {/* Loading skeleton */}
        <div className="w-60 border-r border-sidebar-border bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 max-w-3xl p-8">
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-[200px] h-[168px] bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
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
    <div className="flex-1 flex">
      {/* Zone A: Capture Bar (240px) */}
      <div className="w-60 border-r border-sidebar-border bg-meld-graysmoke/20 flex flex-col">
        <div className="p-4 space-y-4">
          {/* New Win Tile Button */}
          <Button
            onClick={() => setShowNewTileModal(true)}
            className="w-full bg-meld-sand hover:bg-meld-sand/90 text-meld-ink justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Win Tile
            <span className="ml-auto text-xs opacity-70">⌘⌥W</span>
          </Button>

          <div className="border-t border-sidebar-border pt-4">
            <h4 className="text-xs font-medium text-meld-ink/70 mb-3">Quick pick from:</h4>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
              >
                <Star className="w-4 h-4 mr-2 text-meld-sand" />
                Pinned insights
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
              >
                <Pin className="w-4 h-4 mr-2 text-meld-sage" />
                Pinned Log cards
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
              >
                <Tag className="w-4 h-4 mr-2" />
                Manual note
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-meld-ink/70 hover:text-meld-ink hover:bg-white/50"
              >
                <Image className="w-4 h-4 mr-2" />
                Upload image
              </Button>
            </div>
          </div>

          {/* Auto-capture suggestions */}
          {mockSuggestions.length > 0 && (
            <div className="border-t border-sidebar-border pt-4">
              <h4 className="text-xs font-medium text-meld-ink/70 mb-3">Suggestions</h4>
              <div className="space-y-3">
                {mockSuggestions.slice(0, 2).map((suggestion) => (
                  <div key={suggestion.id} className="bg-white/80 rounded-lg p-3 border border-meld-sand/30">
                    <p className="text-xs text-meld-ink mb-2 leading-relaxed">
                      {suggestion.content}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleSuggestionAccept(suggestion.id)}
                      className="w-full bg-meld-sand/80 hover:bg-meld-sand text-meld-ink text-xs h-7"
                    >
                      {suggestion.action}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly digest */}
          {mockMonthlyDigest.isReady && (
            <div className="border-t border-sidebar-border pt-4">
              <div className="bg-meld-sage/10 rounded-lg p-3 border border-meld-sage/30">
                <h4 className="text-sm font-medium text-meld-ink mb-2">
                  {mockMonthlyDigest.month} Wins Ready
                </h4>
                <p className="text-xs text-meld-ink/70 mb-3">
                  {mockMonthlyDigest.tileCount} wins from this month
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowDigestModal(true)}
                  className="w-full bg-meld-sage hover:bg-meld-sage/90 text-white text-xs h-7"
                >
                  <Crown className="w-3 h-3 mr-2" />
                  Review Digest
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filter by tag */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <h4 className="text-xs font-medium text-meld-ink/70 mb-2">Filter by tag</h4>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag === 'all' ? 'All tags' : tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Zone B: Tile Canvas (760px) */}
      <div className="flex-1 max-w-3xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif text-2xl text-meld-ink mb-2">Wins Vault</h1>
              <p className="text-meld-ink/60">Evidence of your momentum</p>
            </div>
            
            {selectedTiles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-meld-ink/70">
                  {selectedTiles.length} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleExportPDF}
                  className="bg-meld-sage hover:bg-meld-sage/90 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTiles([])}
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
              placeholder="Search your wins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-meld-ink/20 focus:border-meld-sand"
            />
          </div>

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'gallery' | 'timeline')}>
            <TabsList className="grid w-full grid-cols-2 bg-meld-graysmoke/50">
              <TabsTrigger value="gallery" className="data-[state=active]:bg-white">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-white">
                <List className="w-4 h-4 mr-2" />
                Timeline
                <span className="ml-2 text-xs">⇧Space</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeView === 'gallery' ? renderGalleryView() : renderTimelineView()}
        </ScrollArea>
      </div>

      {/* Zone C: Share Rail (240px) */}
      <div className="w-60 border-l border-sidebar-border bg-meld-graysmoke/20 flex flex-col">
        {selectedTile ? (
          <div className="p-4 space-y-4">
            {/* Preview */}
            <div>
              <h3 className="font-medium text-meld-ink mb-2">Preview</h3>
              <div className="bg-white rounded-lg p-4 border border-meld-ink/10 aspect-[16/9] flex flex-col justify-center items-center text-center">
                <div className="w-8 h-8 bg-meld-sand/20 rounded-lg flex items-center justify-center mb-2">
                  {selectedTile.emoji ? (
                    <span className="text-lg">{selectedTile.emoji}</span>
                  ) : (
                    <Trophy className="w-5 h-5 text-meld-sand" />
                  )}
                </div>
                <h4 className="font-serif font-semibold text-meld-ink text-sm mb-1">
                  {selectedTile.title}
                </h4>
                <p className="text-xs text-meld-ink/60">
                  {selectedTile.date.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Details */}
            <div>
              <h4 className="font-medium text-meld-ink mb-2">Details</h4>
              <div className="space-y-2 text-sm text-meld-ink/70">
                <div className="flex justify-between">
                  <span>Source</span>
                  <span className="capitalize">{sourceConfig[selectedTile.source].label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tags</span>
                  <span>{selectedTile.tags.join(', ')}</span>
                </div>
                {selectedTile.shareCount > 0 && (
                  <div className="flex justify-between">
                    <span>Shares</span>
                    <span>{selectedTile.shareCount}</span>
                  </div>
                )}
              </div>
              
              {selectedTile.impact.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-meld-ink text-sm mb-2">Impact</h5>
                  <ul className="space-y-1">
                    {selectedTile.impact.map((impact, idx) => (
                      <li key={idx} className="text-sm text-meld-ink/70 flex items-start gap-2">
                        <span className="text-meld-sand mt-1">•</span>
                        {impact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-medium text-meld-ink mb-2">Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleQuickShare(selectedTile.id)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy image
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share link
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Growth hook */}
            <div className="border-t border-sidebar-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-meld-ink/70">Add mentor quote</span>
                <input type="checkbox" className="rounded" />
              </div>
              <p className="text-xs text-meld-ink/60">
                Adds anonymized AI coaching insight to shared version
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-meld-ink/60">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select a win tile to preview and share</p>
          </div>
        )}
      </div>

      {/* New Tile Modal */}
      <Dialog open={showNewTileModal} onOpenChange={setShowNewTileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Win Tile</DialogTitle>
            <DialogDescription>
              Capture a moment of success or progress to celebrate and share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Win title..."
              value={newTile.title}
              onChange={(e) => setNewTile(prev => ({ ...prev, title: e.target.value }))}
              className="border-meld-ink/20 focus:border-meld-sand"
            />
            
            <Textarea
              placeholder="Describe what happened and why it matters..."
              value={newTile.description}
              onChange={(e) => setNewTile(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-20 resize-none border-meld-ink/20 focus:border-meld-sand"
            />
            
            <div>
              <label className="text-sm font-medium text-meld-ink mb-2 block">Impact (up to 3 points)</label>
              {newTile.impact.map((impact, idx) => (
                <Input
                  key={idx}
                  placeholder={`Impact ${idx + 1}...`}
                  value={impact}
                  onChange={(e) => setNewTile(prev => ({
                    ...prev,
                    impact: prev.impact.map((i, index) => index === idx ? e.target.value : i)
                  }))}
                  className="mb-2 border-meld-ink/20 focus:border-meld-sand"
                />
              ))}
            </div>
            
            <div className="flex justify-between">
              <div className="flex gap-2">
                {['🎯', '🚀', '💡', '🏆', '⭐', '🎉'].map(emoji => (
                  <Button
                    key={emoji}
                    variant={newTile.emoji === emoji ? 'default' : 'outline'}
                    size="sm"
                    className="text-lg p-2 h-auto"
                    onClick={() => setNewTile(prev => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTileModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTile}
                  className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink"
                >
                  Create Tile
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Digest Modal */}
      <Dialog open={showDigestModal} onOpenChange={setShowDigestModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mockMonthlyDigest.month} {mockMonthlyDigest.year} Wins Digest</DialogTitle>
            <DialogDescription>
              Review and export your wins from this month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {mockMonthlyDigest.previewTiles.map(tile => (
                <div key={tile.id} className="aspect-square bg-meld-sand/10 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-2">{tile.emoji}</div>
                  <h4 className="font-medium text-sm text-meld-ink">{tile.title}</h4>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between">
              <p className="text-sm text-meld-ink/70">
                {mockMonthlyDigest.tileCount} total wins this month
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink">
                  <Share className="w-4 h-4 mr-2" />
                  Share Digest
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
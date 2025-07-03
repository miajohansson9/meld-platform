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
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { ScrollArea } from '../ui/ScrollArea';
import { Checkbox } from '../ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { cn } from '~/utils';
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



export function WinsVaultModule() {
  const [activeView, setActiveView] = useState<'gallery' | 'timeline'>('gallery');
  const [winTiles, setWinTiles] = useState<WinTile[]>(mockWinTiles);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState<WinTile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showNewTileModal, setShowNewTileModal] = useState(false);
  const [showEditTileModal, setShowEditTileModal] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [winDescription, setWinDescription] = useState('');
  const [editingTile, setEditingTile] = useState<WinTile | null>(null);
  const [editTileData, setEditTileData] = useState({
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
        } else if (showEditTileModal) {
          setShowEditTileModal(false);
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
  }, [selectedTile, showNewTileModal, showEditTileModal, showDigestModal]);

  const handleCreateTile = () => {
    if (!winDescription.trim()) return;

    // In real app, this would send to backend for AI processing
    // For now, we'll create a simple tile
    const tile: WinTile = {
      id: Date.now().toString(),
      title: winDescription.length > 50 ? winDescription.substring(0, 50) + '...' : winDescription,
      date: new Date(),
      tags: ['Win'], // Backend would generate appropriate tags
      source: 'manual',
      emoji: '🎯', // Backend would suggest appropriate emoji
      description: winDescription,
      impact: [], // Backend would generate impact points
      isPinned: false,
      isShared: false,
      shareCount: 0
    };

    setWinTiles(prev => [tile, ...prev]);
    setWinDescription('');
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

  const handleEditTile = (tile: WinTile) => {
    setEditingTile(tile);
    setEditTileData({
      title: tile.title,
      description: tile.description || '',
      tags: tile.tags,
      impact: tile.impact.length > 0 ? tile.impact : ['', '', ''],
      emoji: tile.emoji || '🎯'
    });
    setShowEditTileModal(true);
  };

  const handleUpdateTile = () => {
    if (!editingTile || !editTileData.title.trim()) return;

    setWinTiles(prev => prev.map(tile => 
      tile.id === editingTile.id 
        ? {
            ...tile,
            title: editTileData.title,
            description: editTileData.description,
            tags: editTileData.tags,
            impact: editTileData.impact.filter(i => i.trim()),
            emoji: editTileData.emoji
          }
        : tile
    ));

    setShowEditTileModal(false);
    setEditingTile(null);
    toast.success('Win tile updated! ✨', { duration: 2000 });
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
          "win-tile-card group bg-white rounded-xl border border-meld-graysmoke cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-meld-sage ring-offset-2",
          "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
        )}
        onClick={() => handleTileClick(tile)}
        role="button"
        aria-label={`Win: ${tile.title}, ${tile.date.toLocaleDateString()}`}
        style={{ width: '186px', height: '160px' }}
      >
        <div className="p-3 h-full flex flex-col">
          {/* Header with emoji and selection */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-meld-sand/20 to-meld-sage/10 rounded-lg flex items-center justify-center">
              {tile.emoji ? (
                <span className="text-lg">{tile.emoji}</span>
              ) : (
                <Trophy className="w-4 h-4 text-meld-sand" />
              )}
            </div>
            
            {/* Selection checkbox - only show on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleTileSelect(tile.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
            </div>
          </div>

          {/* Title - limited to 2 lines */}
          <h3 className="font-serif text-sm font-medium text-meld-ink mb-2 line-clamp-2 leading-tight">
            {tile.title}
          </h3>

          {/* Date and primary tag */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-meld-ink/60 font-medium">
              {tile.date.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            {tile.tags[0] && (
              <span className="text-xs px-2 py-0.5 bg-meld-sand/20 text-meld-ink border border-meld-sand/30 rounded-full">
                {tile.tags[0]}
              </span>
            )}
          </div>

          {/* Bottom action strip - shows on hover */}
          <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinTile(tile.id);
                }}
                className="p-1 h-auto text-meld-ink/50 hover:text-meld-sage"
              >
                <Pin className={cn("w-3.5 h-3.5", tile.isPinned && "fill-current text-meld-sage")} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickShare(tile.id);
                }}
                className="p-1 h-auto text-meld-ink/50 hover:text-meld-sage"
              >
                <Link className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Source indicator */}
            <div className="flex items-center gap-1">
              <SourceIcon className="w-3 h-3 text-meld-ink/40" />
              {tile.isShared && (
                <span className="text-xs text-meld-sage">•</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGalleryView = () => {
    if (sortedTiles.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="p-6">
        {/* Gallery Grid */}
        <div className="grid grid-cols-auto-fit gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(186px, 1fr))' }}>
          {sortedTiles.map((tile, index) => renderWinTile(tile, index))}
        </div>
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
              className="bg-white rounded-lg border border-meld-ink/20 p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                        <span key={tag} className="text-xs px-2 py-0.5 bg-meld-sand/20 text-meld-ink border border-meld-sand rounded-full">
                          {tag}
                        </span>
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
        <div className="w-80 border-r border-meld-ink/20 bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 p-8">
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-[200px] h-[168px] bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="w-80 border-l border-gray-200 bg-meld-graysmoke/20 p-4">
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-meld-canvas flex">
      {/* Left Sidebar (280px) */}
      <div className="w-80 border-r border-meld-graysmoke bg-white flex flex-col">
        {/* New Win Tile Button */}
        <div className="p-4 border-b border-meld-graysmoke">
          <Button
            onClick={() => setShowNewTileModal(true)}
            className="w-full bg-meld-sage hover:bg-meld-sage/90 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Win Tile
            <span className="ml-auto text-xs opacity-75">⌘W</span>
          </Button>
        </div>

        {/* Quick Pick Section */}
        <div className="p-4 border-b border-meld-graysmoke">
          <h3 className="text-sm font-medium text-meld-ink mb-3">Quick pick from:</h3>
          <div className="space-y-2">
            {/* Pinned insights */}
            <div className="flex items-center gap-2 text-sm text-meld-ink/70 hover:text-meld-ink cursor-pointer">
              <Star className="w-4 h-4" />
              Pinned insights
            </div>
            {/* Pinned Log cards */}
            <div className="flex items-center gap-2 text-sm text-meld-ink/70 hover:text-meld-ink cursor-pointer">
              <Tag className="w-4 h-4" />
              Pinned Log cards
            </div>
            {/* Manual note */}
            <div className="flex items-center gap-2 text-sm text-meld-ink/70 hover:text-meld-ink cursor-pointer">
              <Edit3 className="w-4 h-4" />
              Manual note
            </div>
            {/* Upload image */}
            <div className="flex items-center gap-2 text-sm text-meld-ink/70 hover:text-meld-ink cursor-pointer">
              <Camera className="w-4 h-4" />
              Upload image
            </div>
          </div>
        </div>



        {/* Monthly Digest */}
        <div className="p-4 border-b border-meld-graysmoke">
          <div className="bg-meld-canvas p-3 rounded-lg">
            <h4 className="text-sm font-medium text-meld-ink mb-1">June Wins Ready</h4>
            <p className="text-xs text-meld-ink/70 mb-3">12 wins from this month</p>
            <Button
              size="sm"
              onClick={() => setShowDigestModal(true)}
              className="w-full bg-meld-sage text-white hover:bg-meld-sage/90 text-xs h-7"
            >
              <Star className="w-3 h-3 mr-1" />
              Review Digest
            </Button>
          </div>
        </div>

        {/* Filter by tag */}
        <div className="p-4 flex-1">
          <h3 className="text-sm font-medium text-meld-ink mb-3">Filter by tag</h3>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full border-meld-graysmoke focus:border-meld-sage">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent className="bg-white border-meld-ink/20">
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag} className="focus:bg-meld-sage/10 focus:text-meld-ink hover:bg-meld-sage/5">
                  {tag === 'all' ? 'All tags' : tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-meld-graysmoke p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-serif text-meld-ink mb-1">Wins Vault</h1>
              <p className="text-meld-ink/60 text-sm">Evidence of your momentum</p>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-meld-ink/40" />
              <Input
                ref={searchInputRef}
                placeholder="Search your wins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-meld-graysmoke focus:border-meld-sage"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-meld-canvas rounded-lg p-1">
              <Button
                variant={activeView === 'gallery' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('gallery')}
                className={cn(
                  "px-3 py-1 text-xs",
                  activeView === 'gallery' 
                    ? "bg-white text-meld-ink shadow-sm" 
                    : "text-meld-ink/60 hover:text-meld-ink"
                )}
              >
                <Grid3X3 className="w-3 h-3 mr-1" />
                Gallery
              </Button>
              <Button
                variant={activeView === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('timeline')}
                className={cn(
                  "px-3 py-1 text-xs",
                  activeView === 'timeline' 
                    ? "bg-white text-meld-ink shadow-sm" 
                    : "text-meld-ink/60 hover:text-meld-ink"
                )}
              >
                <List className="w-3 h-3 mr-1" />
                Timeline
              </Button>
            </div>

            {/* Space indicator */}
            <div className="flex items-center text-xs text-meld-ink/60">
              <span>◊ Space</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeView === 'gallery' ? renderGalleryView() : renderTimelineView()}
        </ScrollArea>
      </div>

      {/* Preview/Share Panel */}
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
        {selectedTile ? (
          <div className="p-6 space-y-6">
            {/* Preview */}
            <div>
              <h3 className="text-lg font-serif text-meld-ink mb-4">Preview</h3>
              <div className="bg-gradient-to-br from-meld-canvas to-meld-sand/10 rounded-xl p-6 border border-meld-graysmoke aspect-[4/3] flex flex-col justify-center items-center text-center relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 w-12 h-12 bg-meld-sage rounded-full"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 bg-meld-rose rounded-full"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-meld-sand/30 to-meld-sage/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    {selectedTile.emoji ? (
                      <span className="text-2xl">{selectedTile.emoji}</span>
                    ) : (
                      <Trophy className="w-6 h-6 text-meld-sand" />
                    )}
                  </div>
                  <h4 className="font-serif font-semibold text-meld-ink text-lg mb-2 leading-tight">
                    {selectedTile.title}
                  </h4>
                  <p className="text-sm text-meld-ink/60 font-medium">
                    {selectedTile.date.toLocaleDateString('en-US', { 
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h4 className="text-lg font-serif text-meld-ink mb-4">Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-meld-ink/60 font-medium">Source</span>
                  <span className="text-meld-ink font-medium">{sourceConfig[selectedTile.source].label}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-meld-ink/60 font-medium">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedTile.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-meld-sand/20 text-meld-ink border border-meld-sand/30 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedTile.impact.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-meld-ink mb-3">Impact</h5>
                  <ul className="space-y-2">
                    {selectedTile.impact.map((impact, idx) => (
                      <li key={idx} className="text-sm text-meld-ink/70 flex items-start gap-3 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-meld-sage rounded-full mt-2 flex-shrink-0"></span>
                        {impact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-lg font-serif text-meld-ink mb-4">Actions</h4>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 border-meld-graysmoke hover:border-meld-sage hover:bg-meld-sage/5"
                  onClick={() => handleEditTile(selectedTile)}
                >
                  <Edit3 className="w-4 h-4 mr-3" />
                  Edit tile
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 border-meld-graysmoke hover:border-meld-sage hover:bg-meld-sage/5"
                  onClick={() => handleQuickShare(selectedTile.id)}
                >
                  <Copy className="w-4 h-4 mr-3" />
                  Copy image
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 border-meld-graysmoke hover:border-meld-sage hover:bg-meld-sage/5"
                >
                  <Share className="w-4 h-4 mr-3" />
                  Share link
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 border-meld-graysmoke hover:border-meld-sage hover:bg-meld-sage/5"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Add mentor quote */}
            <div className="border-t border-meld-graysmoke pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-meld-ink">Add mentor quote</span>
                <Checkbox className="w-4 h-4" />
              </div>
              <p className="text-xs text-meld-ink/60 leading-relaxed">
                Adds anonymized AI coaching insight to shared version
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-meld-ink/60 flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 bg-meld-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-meld-ink/40" />
            </div>
            <h3 className="font-serif text-lg text-meld-ink mb-2">Preview</h3>
            <p className="text-sm text-meld-ink/60">Select a win tile to preview and share</p>
          </div>
        )}
      </div>

      {/* New Tile Modal */}
      <Dialog open={showNewTileModal} onOpenChange={setShowNewTileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Describe Your Win</DialogTitle>
            <DialogDescription>
              Tell us about your success and we'll turn it into a beautiful win tile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <Textarea
              placeholder="Describe your win... What happened? Why was it meaningful? What impact did it have?"
              value={winDescription}
              onChange={(e) => setWinDescription(e.target.value)}
              className="min-h-32 resize-none border-meld-ink/10 focus:border-meld-sand"
              autoFocus
            />
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowNewTileModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTile}
                disabled={!winDescription.trim()}
                className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink disabled:opacity-50"
              >
                Create Win Tile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tile Modal */}
      <Dialog open={showEditTileModal} onOpenChange={setShowEditTileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Win Tile</DialogTitle>
            <DialogDescription>
              Update your win tile details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <Input
              placeholder="Win title..."
              value={editTileData.title}
              onChange={(e) => setEditTileData(prev => ({ ...prev, title: e.target.value }))}
              className="border-meld-ink/10 focus:border-meld-sand"
            />
            
            <Textarea
              placeholder="Describe what happened and why it matters..."
              value={editTileData.description}
              onChange={(e) => setEditTileData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-20 resize-none border-meld-ink/10 focus:border-meld-sand"
            />
            
            <div>
              <label className="text-sm font-medium text-meld-ink mb-2 block">Impact (up to 3 points)</label>
              {editTileData.impact.map((impact, idx) => (
                <Input
                  key={idx}
                  placeholder={`Impact ${idx + 1}...`}
                  value={impact}
                  onChange={(e) => setEditTileData(prev => ({
                    ...prev,
                    impact: prev.impact.map((i, index) => index === idx ? e.target.value : i)
                  }))}
                  className="mb-2 border-meld-ink/10 focus:border-meld-sand"
                />
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowEditTileModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTile}
                disabled={!editTileData.title.trim()}
                className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink disabled:opacity-50"
              >
                Update Tile
              </Button>
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
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {mockMonthlyDigest.previewTiles.map(tile => (
                <div key={tile.id} className="aspect-square bg-meld-sand/10 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-2">{tile.emoji}</div>
                  <h4 className="font-medium text-sm text-meld-ink">{tile.title}</h4>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-4">
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

export default WinsVaultModule;
import React, { useState } from 'react';
import { Plus, Star, Trophy, Tag, Grid3X3, List, Edit3, MessageSquare, FileText, Zap } from 'lucide-react';
import { Button } from '~/components/ui';
import { cn } from '~/utils';

interface WinTile {
  id: string;
  title: string;
  date: Date;
  tags: string[];
  source: 'log' | 'chat' | 'manual' | 'fragment';
  emoji?: string;
  description?: string;
  isPinned: boolean;
  isShared: boolean;
}

const sourceConfig = {
  log: {
    icon: FileText,
    label: 'Log Entry',
    color: 'text-meld-sage',
    bgColor: 'bg-meld-sage/10'
  },
  chat: {
    icon: MessageSquare,
    label: 'Chat Thread',
    color: 'text-meld-sand',
    bgColor: 'bg-meld-sand/10'
  },
  manual: {
    icon: Edit3,
    label: 'Manual Entry',
    color: 'text-meld-ink',
    bgColor: 'bg-meld-graysmoke/20'
  },
  fragment: {
    icon: Zap,
    label: 'Fragment',
    color: 'text-meld-rose',
    bgColor: 'bg-meld-rose/10'
  }
};

const mockWinTiles: WinTile[] = [
  {
    id: '1',
    title: 'Story Presentation Success',
    date: new Date('2025-06-28T14:30:00'),
    tags: ['Growth', 'Speaking'],
    source: 'log',
    emoji: '🎯',
    description: 'Delivered the quarterly story with confidence and got great feedback',
    isPinned: true,
    isShared: false,
  },
  {
    id: '2',
    title: 'Difficult Conversation Win',
    date: new Date('2025-06-26T10:15:00'),
    tags: ['Communication', 'Leadership'],
    source: 'chat',
    emoji: '💬',
    description: 'Successfully navigated a challenging team conversation about project priorities',
    isPinned: false,
    isShared: true,
  },
  {
    id: '3',
    title: 'Mentorship Milestone',
    date: new Date('2025-06-24T16:45:00'),
    tags: ['Growth', 'Mentoring'],
    source: 'fragment',
    emoji: '🌱',
    description: 'Helped junior team member breakthrough on complex problem',
    isPinned: false,
    isShared: false,
  },
  {
    id: '4',
    title: 'Process Improvement Win',
    date: new Date('2025-06-22T11:20:00'),
    tags: ['Process', 'Innovation'],
    source: 'manual',
    emoji: '⚡',
    description: 'Streamlined the weekly planning process, saving 2 hours per week',
    isPinned: false,
    isShared: false,
  },
];

export function WinsVaultModule() {
  const [tiles, setTiles] = useState(mockWinTiles);
  const [viewMode, setViewMode] = useState<'gallery' | 'timeline'>('gallery');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Get all unique tags
  const allTags = Array.from(new Set(tiles.flatMap(tile => tile.tags)));
  const tagFilters = [
    { key: 'all', label: 'All Wins' },
    ...allTags.map(tag => ({ key: tag, label: tag }))
  ];

  const filteredTiles = tiles.filter(tile => 
    selectedTag === 'all' || tile.tags.includes(selectedTag)
  );

  const handlePinTile = (tileId: string) => {
    setTiles(prev => 
      prev.map(tile => 
        tile.id === tileId ? { ...tile, isPinned: !tile.isPinned } : tile
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderWinTile = (tile: WinTile) => {
    const config = sourceConfig[tile.source];
    const SourceIcon = config.icon;

    return (
      <div
        key={tile.id}
        className="bg-white rounded-lg border border-meld-graysmoke/50 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {tile.emoji && (
                <span className="text-2xl">{tile.emoji}</span>
              )}
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <SourceIcon className={cn('w-4 h-4', config.color)} strokeWidth={1.5} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePinTile(tile.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <Star 
                className={cn(
                  'w-4 h-4',
                  tile.isPinned ? 'text-meld-sand fill-current' : 'text-meld-ink/40'
                )} 
                strokeWidth={1.5} 
              />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="font-medium text-meld-ink leading-tight">
              {tile.title}
            </h3>
            
            {tile.description && (
              <p className="text-sm text-meld-ink/70 leading-relaxed">
                {tile.description}
              </p>
            )}

            {/* Tags */}
            {tile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-meld-graysmoke/30 text-meld-ink/70 rounded-full"
                  >
                    <Tag className="w-3 h-3" strokeWidth={1.5} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-meld-graysmoke/30">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-1 rounded-full', config.bgColor, config.color)}>
                  {config.label}
                </span>
                {tile.isShared && (
                  <span className="text-xs text-meld-sage">Shared</span>
                )}
              </div>
              <span className="text-xs text-meld-ink/50">
                {formatDate(tile.date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-meld-canvas">
      {/* Header */}
      <div className="px-8 py-6 border-b border-meld-graysmoke/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-2xl text-meld-ink mb-2">
              Wins Vault
            </h1>
            <p className="text-meld-ink/60">
              {filteredTiles.length} wins collected • {tiles.filter(t => t.isPinned).length} pinned
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-meld-graysmoke/50 rounded-lg">
              <Button
                variant={viewMode === 'gallery' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gallery')}
                className={cn(
                  'border-0 rounded-r-none',
                  viewMode === 'gallery' ? 'bg-meld-sand text-white' : 'text-meld-ink/70'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'border-0 rounded-l-none',
                  viewMode === 'timeline' ? 'bg-meld-sand text-white' : 'text-meld-ink/70'
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button className="bg-meld-sand hover:bg-meld-sand/90 text-white">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add Win
            </Button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2">
          {tagFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={selectedTag === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(filter.key)}
              className={cn(
                selectedTag === filter.key
                  ? 'bg-meld-sand text-white hover:bg-meld-sand/90'
                  : 'text-meld-ink/70 hover:text-meld-ink border-meld-ink/20 hover:border-meld-sand',
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTiles.map(renderWinTile)}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredTiles.map(renderWinTile)}
            </div>
          )}

          {filteredTiles.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-meld-ink/40 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-meld-ink mb-2">No wins in this filter</h3>
              <p className="text-meld-ink/60">Try selecting a different tag or add your first win.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
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
];

export function WinsVaultModule() {
  const [tiles, setTiles] = useState(mockWinTiles);
  const [viewMode, setViewMode] = useState<'gallery' | 'timeline'>('gallery');

  return (
    <div className="flex-1 flex flex-col bg-meld-canvas">
      <div className="px-8 py-6 border-b border-meld-graysmoke/20">
        <h1 className="font-serif text-2xl text-meld-ink mb-2">
          Wins Vault
        </h1>
        <p className="text-meld-ink/60">
          {tiles.length} wins collected
        </p>
      </div>
      
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className="bg-white rounded-lg border border-meld-graysmoke/50 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{tile.emoji}</span>
                <Star className={cn('w-4 h-4', tile.isPinned ? 'text-meld-sand fill-current' : 'text-meld-ink/40')} />
              </div>
              
              <h3 className="font-medium text-meld-ink mb-2">{tile.title}</h3>
              <p className="text-sm text-meld-ink/70 mb-3">{tile.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {tile.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-meld-graysmoke/30 text-meld-ink/70 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="text-xs text-meld-ink/50">
                {tile.date.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
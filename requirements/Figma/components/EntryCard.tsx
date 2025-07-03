import React, { useState } from 'react';
import { Edit3, Star, ChevronRight, MoreHorizontal, ChevronDown, FileText, BarChart3, MessageCircle, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';

export interface LogEntry {
  id: string;
  type: 'plan' | 'reflection' | 'fragment' | 'coach';
  title: string;
  content: string;
  timestamp: string;
  aiEcho?: string;
  alignment?: string;
  microCommit?: string;
  isPinned?: boolean;
  valueTag?: string;
  aiEchoReason?: string;
}

interface EntryCardProps {
  entry: LogEntry;
  className?: string;
  onEdit?: (id: string) => void;
  onPin?: (id: string) => void;
  onViewCoach?: (id: string) => void;
  isFocused?: boolean;
}

const typeConfig = {
  plan: {
    icon: FileText,
    label: 'Morning Plan',
    color: 'var(--meld-sand)'
  },
  reflection: {
    icon: BarChart3,
    label: 'Reflection',
    color: 'var(--meld-sage)'
  },
  fragment: {
    icon: MessageCircle,
    label: 'Fragment',
    color: 'var(--meld-rose)'
  },
  coach: {
    icon: Bot,
    label: 'Coach Response',
    color: 'var(--meld-graysmoke)'
  }
};

export function EntryCard({ 
  entry, 
  className,
  onEdit,
  onPin,
  onViewCoach,
  isFocused = false
}: EntryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [aiEchoExpanded, setAiEchoExpanded] = useState(false);
  const config = typeConfig[entry.type];
  const TypeIcon = config.icon;

  // Build meta sentence
  const buildMetaSentence = () => {
    const parts = [];
    
    if (entry.alignment) {
      parts.push(`✅ ${entry.alignment}`);
    }
    
    if (entry.microCommit) {
      parts.push(`Will ${entry.microCommit}`);
    }
    
    if (entry.valueTag) {
      parts.push(`Tag: ${entry.valueTag}`);
    }
    
    return parts.join(' • ');
  };

  return (
    <div className="relative">
      {/* Timeline nub */}
      <div 
        className="absolute left-0 top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{ 
          backgroundColor: config.color,
          marginLeft: '-8px'
        }}
      />
      
      {/* Main card */}
      <div
        className={cn(
          "ml-8 bg-white rounded-lg transition-all duration-200 cursor-pointer group border border-gray-100",
          isHovered && "shadow-lg transform translate-y-[-1px] border-gray-200",
          isFocused && "ring-2 ring-meld-sand ring-offset-2",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <TypeIcon 
                className="w-5 h-5 flex-shrink-0" 
                strokeWidth={1.5}
                style={{ color: config.color, fill: config.color, fillOpacity: 0.2 }}
              />
              <span className="font-medium text-meld-ink">{config.label}</span>
              <span className="text-sm text-meld-ink/60">•</span>
              <span className="text-sm text-meld-ink/60">{entry.timestamp}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {entry.isPinned ? (
                <Star 
                  className="w-4 h-4 text-meld-sand fill-current" 
                  strokeWidth={1.5}
                  title="Pinned to Wins Vault"
                />
              ) : (
                <Star 
                  className="w-4 h-4 text-meld-ink/20 hover:text-meld-sand transition-colors" 
                  strokeWidth={1.5}
                  title="Pin to Wins Vault"
                />
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-meld-ink/40 hover:text-meld-ink p-1 h-auto"
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPin?.(entry.id)}>
                    {entry.isPinned ? 'Unpin from Wins' : 'Pin to Wins Vault'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>Copy excerpt</DropdownMenuItem>
                  <DropdownMenuItem>Export card</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-3">
            <p className="text-meld-ink leading-relaxed">"{entry.content}"</p>
            
            {/* Meta sentence */}
            {buildMetaSentence() && (
              <p className="text-sm text-meld-ink/70 leading-relaxed">
                {buildMetaSentence()}
              </p>
            )}
          </div>

          {/* AI Echo - removed tooltip */}
          {entry.aiEcho && (
            <div className="bg-meld-sage/10 rounded-lg p-3 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiEchoExpanded(!aiEchoExpanded)}
                className="w-full justify-start p-0 h-auto text-left mb-2 hover:bg-transparent"
              >
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 mr-2 transition-transform",
                    aiEchoExpanded && "rotate-180"
                  )} 
                  strokeWidth={1.5} 
                />
                <span className="text-sm font-medium text-meld-sage">
                  Echo from Coach • Story Pattern
                </span>
              </Button>
              
              {aiEchoExpanded && (
                <p className="text-sm text-meld-ink/70 leading-relaxed pl-6">
                  "{entry.aiEcho}"
                </p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(entry.id)}
                className="text-meld-ink/60 hover:text-meld-ink p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-4 h-4 mr-1" strokeWidth={1.5} />
                Edit
              </Button>
              
              {entry.type !== 'coach' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewCoach?.(entry.id)}
                  className="text-meld-ink/60 hover:text-meld-ink p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4 mr-1" strokeWidth={1.5} />
                  View Coach
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
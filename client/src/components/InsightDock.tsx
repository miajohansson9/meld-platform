import React, { useState } from 'react';
import { Search, ChevronDown, ArrowDown, FileText, BarChart3, MessageCircle, Bot, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';

interface InsightDockProps {
  className?: string;
  onFiltersChange?: (filters: {
    types: string[];
    valueTag?: string;
    search?: string;
  }) => void;
  onJumpTo?: (target: string) => void;
}

const entryTypes = [
  { id: 'plan', label: 'Plan (Do)', color: 'bg-meld-sand text-meld-ink', icon: FileText },
  { id: 'reflection', label: 'Reflection (Learn)', color: 'bg-meld-sage text-white', icon: BarChart3 },
  { id: 'fragment', label: 'Fragment (Clue)', color: 'bg-meld-rose text-meld-ink', icon: MessageCircle },
  { id: 'coach', label: 'Mentor (Coach)', color: 'bg-meld-graysmoke text-meld-ink', icon: Bot }
];

const valueTags = ['Growth', 'Insight', 'Connection', 'Impact', 'Learning'];

// Mock mini-map data - represents entry density per day (doubled height)
const miniMapData = [
  { day: 1, count: 0, type: 'plan' },
  { day: 2, count: 1, type: 'reflection' },
  { day: 3, count: 3, type: 'plan' },
  { day: 4, count: 8, type: 'fragment' },
  { day: 5, count: 3, type: 'plan' },
  { day: 6, count: 0, type: 'plan' },
  { day: 7, count: 2, type: 'reflection' },
  { day: 8, count: 4, type: 'fragment' },
  { day: 9, count: 1, type: 'coach' },
  { day: 10, count: 3, type: 'plan' },
  { day: 11, count: 0, type: 'plan' },
  { day: 12, count: 0, type: 'plan' },
  { day: 13, count: 2, type: 'reflection' },
  { day: 14, count: 5, type: 'plan' }, // Today
  { day: 15, count: 0, type: 'plan' },
];

export function InsightDock({ className, onFiltersChange, onJumpTo }: InsightDockProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedValueTag, setSelectedValueTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [daysUntilNarrativeCheckIn] = useState(4); // Mock: 4 days until next check-in

  const handleTypeToggle = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newTypes);
    onFiltersChange?.({
      types: newTypes,
      valueTag: selectedValueTag || undefined,
      search: searchQuery || undefined
    });
  };

  const handleValueTagChange = (tag: string) => {
    const newTag = tag === selectedValueTag ? '' : tag;
    setSelectedValueTag(newTag);
    onFiltersChange?.({
      types: selectedTypes,
      valueTag: newTag || undefined,
      search: searchQuery || undefined
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange?.({
      types: selectedTypes,
      valueTag: selectedValueTag || undefined,
      search: value || undefined
    });
  };

  const getBarHeight = (count: number) => {
    const maxCount = Math.max(...miniMapData.map(d => d.count));
    return Math.max(4, (count / maxCount) * 48); // Doubled from 24 to 48
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'plan': return 'var(--meld-sand)';
      case 'reflection': return 'var(--meld-sage)';
      case 'fragment': return 'var(--meld-rose)';
      case 'coach': return 'var(--meld-graysmoke)';
      default: return 'var(--meld-graysmoke)';
    }
  };

  const getTypeIcon = (typeId: string) => {
    const type = entryTypes.find(t => t.id === typeId);
    return type?.icon || FileText;
  };

  return (
    <div className={cn("w-60 bg-meld-canvas border-l border-sidebar-border flex-shrink-0", className)}>
      <div className="p-4 h-full flex flex-col">
        
        {/* Filter Stack */}
        <div className="space-y-6 mb-8">
          <h3 className="font-medium text-meld-ink">Filters</h3>
          
          {/* Type Chips */}
          <div className="space-y-3">
            <label className="text-sm text-meld-ink/70">Entry Types</label>
            <div className="flex flex-wrap gap-2">
              {entryTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTypeToggle(type.id)}
                    className={cn(
                      "text-xs border-meld-graysmoke hover:border-meld-sand transition-colors flex items-center gap-1",
                      selectedTypes.includes(type.id) && type.color
                    )}
                  >
                    <IconComponent className="w-3 h-3" strokeWidth={1.5} />
                    {type.label.split(' ')[0]} {/* Show just "Plan", "Reflection", etc. for space */}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Value Filter */}
          <div className="space-y-3">
            <label className="text-sm text-meld-ink/70">Value Filter</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-between text-sm border-meld-graysmoke hover:border-meld-sand"
                >
                  {selectedValueTag || 'No values yet'}
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => handleValueTagChange('')}>
                  All values
                </DropdownMenuItem>
                {valueTags.map((tag) => (
                  <DropdownMenuItem 
                    key={tag}
                    onClick={() => handleValueTagChange(tag)}
                    className={cn(selectedValueTag === tag && "bg-meld-sand/20")}
                  >
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Box */}
          <div className="space-y-3">
            <label className="text-sm text-meld-ink/70">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-meld-ink/40" strokeWidth={1.5} />
              <Input
                placeholder="Search title, text, tags (⌘/)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 pl-9 text-sm border-meld-graysmoke focus:border-meld-sand"
              />
            </div>
          </div>
        </div>

        {/* Mini-Map */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-meld-ink">June 2025</h3>
          
          <div className="relative">
            <div className="flex items-end gap-1 h-12"> {/* Increased height for taller bars */}
              {miniMapData.map((data) => (
                <div
                  key={data.day}
                  className="relative flex-1 cursor-pointer group"
                  onMouseEnter={() => setHoveredDay(data.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => onJumpTo?.(`day-${data.day}`)}
                >
                  <div
                    className="w-full rounded-sm transition-opacity hover:opacity-80"
                    style={{
                      height: `${getBarHeight(data.count)}px`,
                      backgroundColor: getBarColor(data.type)
                    }}
                  />
                  
                  {hoveredDay === data.day && data.count > 0 && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {data.day} Jun • {data.count} entries
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Updated Legend with copy language */}
          <div className="space-y-2">
            <div className="text-xs text-meld-ink/60 mb-2">Legend</div>
            <div className="grid grid-cols-1 gap-1">
              {entryTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-1 rounded-sm"
                    style={{ backgroundColor: getBarColor(type.id) }}
                  />
                  <span className="text-meld-ink/70">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Jump To Links */}
        <div className="space-y-4">
          <h3 className="font-medium text-meld-ink">Jump to</h3>
          
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJumpTo?.('last-win')}
              className="w-full justify-start text-sm text-meld-ink/70 hover:text-meld-ink hover:bg-meld-graysmoke/50"
            >
              <ArrowDown className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Last big win
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJumpTo?.('low-energy')}
              className="w-full justify-start text-sm text-meld-ink/70 hover:text-meld-ink hover:bg-meld-graysmoke/50"
            >
              <ArrowDown className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Last low-energy day
            </Button>

            {/* Narrative Check-in Link - Track 2 hook */}
            {daysUntilNarrativeCheckIn <= 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onJumpTo?.('narrative-checkin')}
                className="w-full justify-start text-sm text-meld-sage hover:text-meld-sage hover:bg-meld-sage/10"
              >
                <Calendar className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Next Narrative Check-in (due in {daysUntilNarrativeCheckIn} days)
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJumpTo?.('first-entry')}
              className="w-full justify-start text-sm text-meld-ink/70 hover:text-meld-ink hover:bg-meld-graysmoke/50"
            >
              <ArrowDown className="w-4 h-4 mr-2" strokeWidth={1.5} />
              First entry
            </Button>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(selectedTypes.length > 0 || selectedValueTag || searchQuery) && (
          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-meld-ink/60">Active filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedValueTag('');
                  setSearchQuery('');
                  onFiltersChange?.({ types: [], valueTag: undefined, search: undefined });
                }}
                className="text-xs text-meld-ink/60 hover:text-meld-ink p-1 h-auto"
              >
                Clear all
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {selectedTypes.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {entryTypes.find(t => t.id === type)?.label.split(' ')[0]}
                </Badge>
              ))}
              {selectedValueTag && (
                <Badge variant="secondary" className="text-xs">
                  {selectedValueTag}
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  "{searchQuery}"
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
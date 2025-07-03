import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { ChevronUp } from 'lucide-react';
import { EntryCard, LogEntry } from './EntryCard';
import { cn } from '~/utils';

interface ChronicleCanvasProps {
  className?: string;
  filters?: {
    types: string[];
    valueTag?: string;
    search?: string;
  };
  selectedMonth?: string;
}

// Mock data for the timeline
const mockEntries: LogEntry[] = [
  {
    id: '1',
    type: 'plan',
    title: 'Morning Plan',
    content: 'Finish slide deck for Q3 strategy presentation. Focus on storytelling arc that connects data to vision.',
    timestamp: '08:03',
    alignment: 'Product North Star',
    microCommit: 'share w/ Jess',
    aiEcho: 'Noted your focus on storytelling—check fragment "Arc > Data" when ready.',
    valueTag: 'Growth',
    isPinned: false,
    tags: ['presentation', 'strategy', 'storytelling']
  },
  {
    id: '2',
    type: 'reflection',
    title: 'Evening Reflection',
    content: 'Presentation went better than expected. The storytelling approach really landed—saw nods during the vision section.',
    timestamp: '19:30',
    aiEcho: 'Great outcome! This aligns with your "speak with conviction" fragment from last month.',
    valueTag: 'Growth',
    isPinned: true,
    tags: ['success', 'confidence', 'communication']
  },
  {
    id: '3',
    type: 'fragment',
    title: 'Fragment',
    content: 'The best way to find out if you can trust somebody is to trust them.',
    timestamp: '14:22',
    valueTag: 'Insight',
    isPinned: false,
    tags: ['trust', 'relationships']
  },
  {
    id: '4',
    type: 'fragment',
    title: 'Fragment',
    content: 'I realized that I\'ve been avoiding difficult conversations because I\'m afraid of conflict. But avoiding them creates more problems.',
    timestamp: '12:15',
    valueTag: 'Growth',
    isPinned: true,
    tags: ['communication', 'growth', 'self-awareness']
  },
  {
    id: '5',
    type: 'fragment',
    title: 'Fragment',
    content: 'How can I better balance being supportive of my team while still maintaining high standards?',
    timestamp: '10:45',
    valueTag: 'Leadership',
    isPinned: false,
    tags: ['leadership', 'management', 'balance']
  },
  {
    id: '6',
    type: 'coach',
    title: 'Coach Response',
    content: 'I notice you\'ve been developing your presentation skills consistently. Would you like to explore how this connects to your broader communication goals?',
    timestamp: '20:15',
    isPinned: false
  }
];

// Group entries by date
const groupEntriesByDate = (entries: LogEntry[]) => {
  const groups: { [key: string]: LogEntry[] } = {};
  
  entries.forEach(entry => {
    const date = 'Tues • 25 Jun 2025'; // Mock date - in real app would parse from entry
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
  });
  
  return groups;
};

export function ChronicleCanvas({ className, filters }: ChronicleCanvasProps) {
  const [filteredEntries, setFilteredEntries] = useState<LogEntry[]>(mockEntries);
  const [focusedEntry, setFocusedEntry] = useState<string | null>(null);
  const [showJumpToday, setShowJumpToday] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Apply filters
  useEffect(() => {
    let filtered = mockEntries;
    
    if (filters?.types && filters.types.length > 0) {
      filtered = filtered.filter(entry => filters.types.includes(entry.type));
    }
    
    if (filters?.valueTag) {
      filtered = filtered.filter(entry => entry.valueTag === filters.valueTag);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.content.toLowerCase().includes(searchLower) ||
        entry.aiEcho?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEntries(filtered);
  }, [filters]);

  // Handle scroll for jump to today button
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      setShowJumpToday(scrollTop > 1000); // Show after 1000px scroll
    };

    // Find the actual scrollable element within the ScrollArea
    const scrollableElement = scrollElement.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', handleScroll);
      return () => scrollableElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const entryIds = filteredEntries.map(entry => entry.id);
        const currentIndex = focusedEntry ? entryIds.indexOf(focusedEntry) : -1;
        
        if (e.key === 'j' && currentIndex < entryIds.length - 1) {
          setFocusedEntry(entryIds[currentIndex + 1]);
        } else if (e.key === 'k' && currentIndex > 0) {
          setFocusedEntry(entryIds[currentIndex - 1]);
        } else if (e.key === 'j' && currentIndex === -1) {
          setFocusedEntry(entryIds[0]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredEntries, focusedEntry]);

  const handleEdit = (id: string) => {
    console.log('Edit entry:', id);
  };

  const handlePin = (id: string) => {
    setFilteredEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, isPinned: !entry.isPinned } : entry
      )
    );
  };

  const handleViewCoach = (id: string) => {
    console.log('View coach for entry:', id);
  };

  const jumpToToday = () => {
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      const scrollableElement = scrollElement.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollableElement) {
        scrollableElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  if (filteredEntries.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center p-8 border-2 border-dashed border-meld-graysmoke rounded-lg max-w-md">
          <h3 className="font-serif text-lg text-meld-ink mb-2">Nothing here yet</h3>
          <p className="text-meld-ink/70 text-sm leading-relaxed">
            Try a wider time window or remove some filters to see your entries.
          </p>
        </div>
      </div>
    );
  }

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className={cn("flex-1 relative", className)}>
      {/* Timeline spine - positioned correctly at 56px from edge */}
      <div 
        className="absolute left-14 top-0 bottom-0 w-px"
        style={{ 
          backgroundColor: '#E5E3DE',
          opacity: 0.3
        }}
      />
      
      <div ref={scrollContainerRef} className="h-full">
        <ScrollArea className="h-full">
          <div className="p-6 lg:p-8 xl:p-12 space-y-6">
            {Object.entries(groupedEntries).map(([date, entries]) => (
              <div key={date} className="space-y-4">
                {/* Sticky Date Pill */}
                <div className="sticky top-0 z-10 pb-2">
                  <div 
                    className="inline-block px-4 py-2 rounded-full border border-meld-ink/50 backdrop-blur-sm"
                    style={{ 
                      background: 'linear-gradient(135deg, #EAE9E3 0%, #F9F8F5 100%)'
                    }}
                  >
                    <span className="font-serif text-sm text-meld-sage font-medium tracking-wide uppercase">
                      {date}
                    </span>
                  </div>
                </div>
                
                {/* Entries for this date */}
                <div className="space-y-4 ml-8">
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onPin={handlePin}
                      onViewCoach={handleViewCoach}
                      isFocused={focusedEntry === entry.id}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Loading indicator for infinite scroll */}
            <div className="text-center py-8">
              <div className="text-sm text-meld-ink/50">Loading more entries...</div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Jump to Today FAB */}
      {showJumpToday && (
        <Button
          onClick={jumpToToday}
          className="fixed bottom-6 left-6 bg-meld-sand hover:bg-meld-sand/90 text-meld-ink shadow-lg z-50"
          size="sm"
        >
          <ChevronUp className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Today
        </Button>
      )}
    </div>
  );
}

export default ChronicleCanvas;
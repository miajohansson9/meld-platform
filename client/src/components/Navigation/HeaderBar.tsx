import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, User } from 'lucide-react';
import { Button } from '~/components/ui/Button';
// import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/Avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { cn } from '~/utils';

interface HeaderBarProps {
  className?: string;
  currentPage?: string;
  selectedDate?: Date;
  onDateChange?: (direction: 'prev' | 'next') => void;
}

const getPageTitle = (page: string, date?: Date) => {
  const isToday = date && date.toDateString() === new Date().toDateString();
  
  switch (page) {
    case 'today':
      return isToday ? 'Today' : date?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    case 'log':
      return 'Activity Log';
    case 'coach-feed':
      return 'Mentor Feed';
    case 'chats':
      return 'Conversations';
    case 'fragments':
      return 'Fragments';
    case 'north-star':
      return 'North-Star Map';
    case 'library':
      return 'Wins Vault';
    case 'me':
      return 'Profile';
    default:
      return 'Meld';
  }
};

export function HeaderBar({ 
  className, 
  currentPage = 'today', 
  selectedDate = new Date(),
  onDateChange 
}: HeaderBarProps) {
  const [showPrevDate, setShowPrevDate] = useState(false);
  const [showNextDate, setShowNextDate] = useState(false);

  const prevDate = new Date(selectedDate);
  prevDate.setDate(selectedDate.getDate() - 1);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(selectedDate.getDate() + 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const currentDateString = formatDate(selectedDate);
  const showDateNavigation = currentPage === 'today' || currentPage === 'log';

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-meld-canvas border-b border-sidebar-border", className)}>
      {/* Left: Date */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-meld-ink/70 uppercase tracking-wider">
          {currentDateString.replace(',', ' ·')}
        </div>
      </div>

      {/* Center: Title and Navigation */}
      <div className="flex items-center gap-4">
        {showDateNavigation && (
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-meld-graysmoke/50"
              onMouseEnter={() => setShowPrevDate(true)}
              onMouseLeave={() => setShowPrevDate(false)}
              onClick={() => onDateChange?.('prev')}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            {showPrevDate && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {formatShortDate(prevDate)}
              </div>
            )}
          </div>
        )}
        
        <h1 className="font-serif text-2xl text-meld-ink">
          {getPageTitle(currentPage, selectedDate)}
        </h1>
        
        {showDateNavigation && (
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-meld-graysmoke/50"
              onMouseEnter={() => setShowNextDate(true)}
              onMouseLeave={() => setShowNextDate(false)}
              onClick={() => onDateChange?.('next')}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            {showNextDate && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {formatShortDate(nextDate)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Profile Avatar - Simple implementation for Phase 2 */}
        <div className="w-8 h-8 bg-meld-sand text-meld-ink font-medium text-sm rounded-full flex items-center justify-center">
          MJ
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="p-2 hover:bg-meld-graysmoke/50 relative">
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-meld-ember rounded-full"></div>
        </Button>

        {/* Global Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              className="bg-meld-sand hover:bg-meld-sand/80 text-meld-ink border-0 rounded-full w-8 h-8 p-0"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>New Reflection</DropdownMenuItem>
            <DropdownMenuItem>New Fragment</DropdownMenuItem>
            <DropdownMenuItem>Instant Help Chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default HeaderBar; 
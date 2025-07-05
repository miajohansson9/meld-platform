import React from 'react';
import DateHeader from './DateHeader';
import { ChevronLeft, ChevronRight, Bell, Plus, Hash, FileText, Target, Star, MoreHorizontal, Pin, Download, VolumeX, Atom, Calendar } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui';
import { cn } from '~/utils';

interface ChatInfo {
  title: string;
  contextChips: string[];
  isPinned: boolean;
  onShowAIProfile?: () => void;
  onThreadAction?: (action: string) => void;
}

interface HeaderBarProps {
  className?: string;
  chatInfo?: ChatInfo;
  date?: string;
  onDateChange?: (date: string) => void;
  showDateNav?: boolean;
}

export default function HeaderBar({ className, chatInfo, date, onDateChange, showDateNav }: HeaderBarProps) {
  const currentDate = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const currentDateString = formatDate(currentDate);

  // Check if the selected date is today
  const today = new Date();
  const todayString = (() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const isToday = date === todayString;

  // Get previous and next dates for tooltips
  const getPrevDate = () => {
    if (!date) return null;
    const current = new Date(date + 'T00:00:00'); // Parse as local date
    current.setDate(current.getDate() - 1);
    return current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getNextDate = () => {
    if (!date || isToday) return null;
    const current = new Date(date + 'T00:00:00'); // Parse as local date
    current.setDate(current.getDate() + 1);
    return current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleTodayClick = () => {
    if (onDateChange && !isToday) {
      onDateChange(todayString);
    }
  };

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-meld-canvas border-b border-gray-200", className)}>
      {/* Left: Date display or empty for balance */}
      <div className="flex items-center gap-4 w-1/3">
        {!showDateNav && (
          <div className="text-sm text-meld-ink/70 uppercase tracking-wider">
            {currentDateString.replace(',', ' ·')}
          </div>
        )}
      </div>

      {/* Center: Date Navigation or Chat Info */}
      {chatInfo ? (
        <div className="flex items-center gap-4 flex-1 justify-center max-w-4xl">
          {/* AI Avatar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={chatInfo.onShowAIProfile}
            className="p-2 h-auto hover:bg-meld-sage/10"
            title="AI Profile & Privacy"
          >
            <Atom className="w-5 h-5 text-meld-sage" strokeWidth={1.5} />
          </Button>

          <h1 className="font-serif text-xl text-meld-ink">
            {chatInfo.title}
          </h1>

          {/* Context Chips */}
          <div className="flex gap-2 flex-wrap">
            {chatInfo.contextChips.map((chip, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs bg-meld-graysmoke/50 hover:bg-meld-sand/20 text-meld-ink/70 hover:text-meld-ink"
              >
                {chip.startsWith('#') ? (
                  <Hash className="w-3 h-3 mr-1" />
                ) : chip.startsWith('Fragment') ? (
                  <FileText className="w-3 h-3 mr-1" />
                ) : (
                  <Target className="w-3 h-3 mr-1" />
                )}
                {chip}
              </Button>
            ))}
          </div>

          {chatInfo.isPinned && (
            <Star className="w-5 h-5 text-meld-sand fill-current" />
          )}

          {/* Thread Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                title="Thread options (⌘.)"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => chatInfo.onThreadAction?.('pin')}>
                <Pin className="w-4 h-4 mr-2" />
                {chatInfo.isPinned ? 'Unpin' : 'Pin'} chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => chatInfo.onThreadAction?.('mute')}>
                <VolumeX className="w-4 h-4 mr-2" />
                Mute for 7 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : showDateNav && date && onDateChange ? (
        <div className="flex items-center gap-4 justify-center">
          {/* Enhanced Date Navigation */}
          <div className="flex items-center gap-2">
            {/* Previous Day Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  const current = new Date(date + 'T00:00:00'); // Parse as local date
                  current.setDate(current.getDate() - 1);
                  const year = current.getFullYear();
                  const month = String(current.getMonth() + 1).padStart(2, '0');
                  const day = String(current.getDate()).padStart(2, '0');
                  onDateChange(`${year}-${month}-${day}`);
                }}
                className="p-2 hover:bg-meld-canvas rounded-lg transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5 text-meld-ink/60" />
              </button>
              {getPrevDate() && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {getPrevDate()}
                  </div>
                </div>
              )}
            </div>

            {/* Date Display */}
            <DateHeader date={date} onDateChange={onDateChange} />

            {/* Next Day Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  const current = new Date(date + 'T00:00:00'); // Parse as local date
                  current.setDate(current.getDate() + 1);
                  const year = current.getFullYear();
                  const month = String(current.getMonth() + 1).padStart(2, '0');
                  const day = String(current.getDate()).padStart(2, '0');
                  onDateChange(`${year}-${month}-${day}`);
                }}
                className="p-2 hover:bg-meld-canvas rounded-lg transition-colors"
                aria-label="Next day"
                disabled={isToday}
                style={isToday ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                <ChevronRight className="w-5 h-5 text-meld-ink/60" />
              </button>
              {getNextDate() && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {getNextDate()}
                  </div>
                </div>
              )}
            </div>

            {/* Today Shortcut Button */}
            {!isToday && (
              <div className="relative group ml-2">
                <button
                  onClick={handleTodayClick}
                  className="p-2 hover:bg-meld-sage/10 rounded-lg transition-colors"
                  aria-label="Go to today"
                >
                  <Calendar className="w-4 h-4 text-meld-sage" />
                </button>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Today
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 justify-center">
          <h1 className="font-serif text-2xl text-meld-ink">Today</h1>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-3 w-1/3 justify-end">
        {/* Profile */}
        <div className="w-8 h-8 rounded-full bg-meld-sand flex items-center justify-center">
          <span className="text-meld-ink font-medium text-sm">MJ</span>
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
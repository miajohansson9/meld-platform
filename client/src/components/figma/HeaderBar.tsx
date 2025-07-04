import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, Hash, FileText, Target, Star, MoreHorizontal, Pin, Download, VolumeX, Atom } from 'lucide-react';
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
}

export default function HeaderBar({ className, chatInfo }: HeaderBarProps) {
  const [showPrevDate, setShowPrevDate] = useState(false);
  const [showNextDate, setShowNextDate] = useState(false);

  const currentDate = new Date();
  const prevDate = new Date(currentDate);
  prevDate.setDate(currentDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 1);

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

  const currentDateString = formatDate(currentDate);

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-meld-canvas border-b border-gray-200", className)}>
      {/* Left: Date */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-meld-ink/70 uppercase tracking-wider">
          {currentDateString.replace(',', ' ·')}
        </div>
      </div>

      {/* Center: Title and Navigation (or Chat Info) */}
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
              <DropdownMenuItem onClick={() => chatInfo.onThreadAction?.('export')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => chatInfo.onThreadAction?.('mute')}>
                <VolumeX className="w-4 h-4 mr-2" />
                Mute for 7 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-meld-graysmoke/50"
              onMouseEnter={() => setShowPrevDate(true)}
              onMouseLeave={() => setShowPrevDate(false)}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            {showPrevDate && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatShortDate(prevDate)}
              </div>
            )}
          </div>
          
          <h1 className="font-serif text-2xl text-meld-ink">Today</h1>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-meld-graysmoke/50"
              onMouseEnter={() => setShowNextDate(true)}
              onMouseLeave={() => setShowNextDate(false)}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            {showNextDate && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatShortDate(nextDate)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
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
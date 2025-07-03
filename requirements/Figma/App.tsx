import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TodayModule } from './components/TodayModule';
import { LogModule } from './components/LogModule';
import { CoachFeedModule } from './components/CoachFeedModule';
import { ChatsModule } from './components/ChatsModule';
import { FragmentsModule } from './components/FragmentsModule';
import { WinsVaultModule } from './components/WinsVaultModule';
import { NorthStarModule } from './components/NorthStarModule';
import { ContextDock } from './components/ContextDock';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';

type CurrentPage = 'today' | 'log' | 'coach-feed' | 'chats' | 'fragments' | 'library' | 'north-star' | 'me';

export default function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('today');
  const [selectedDate, setSelectedDate] = useState(new Date('2025-06-29')); // Sunday, June 29, 2025

  const handleNavigation = (page: string) => {
    if (['today', 'log', 'coach-feed', 'chats', 'fragments', 'library', 'north-star', 'me'].includes(page)) {
      setCurrentPage(page as CurrentPage);
    }
  };

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⌥N for North-Star Narrative
      if (e.metaKey && e.altKey && e.key === 'n') {
        e.preventDefault();
        setCurrentPage('north-star');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  const isToday = (date: Date) => {
    const today = new Date('2025-06-29'); // Current mock date
    return date.toDateString() === today.toDateString();
  };

  // Function to render placeholder for unimplemented pages
  const renderPlaceholder = (title: string, description: string) => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-2xl text-meld-ink mb-3">{title}</h1>
        <p className="text-meld-ink/70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-meld-canvas">
      {/* Global Layout Grid with Sanctuary Margins */}
      <div className="px-12 min-h-screen flex">
        {/* Zone A: Sanctuary Margin (48px = 12 * 4px in Tailwind) is handled by px-12 */}
        
        {/* Zone B: Primary Sidebar (240px) */}
        <Sidebar 
          className="w-60 flex-shrink-0" 
          currentPage={currentPage}
          onNavigate={handleNavigation}
        />
        
        {/* Zones C & D Container */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Main Content */}
          {currentPage === 'today' ? (
            <>
              {/* Today Module with Header and Context Dock */}
              <div className="flex-1 flex flex-col">
                {/* Header Bar spans both Zone C and D */}
                <div className="flex items-center justify-between px-6 py-4 bg-meld-canvas border-b border-sidebar-border">
                  {/* Left: Date */}
                  <div className="text-sm text-meld-ink/70 uppercase tracking-wider">
                    {formatDate(selectedDate).replace(/,/g, ' •')}
                  </div>

                  {/* Center: Title with Navigation */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                      className="text-meld-ink/60 hover:text-meld-ink p-2"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                    </Button>
                    
                    <h1 className="font-serif text-2xl text-meld-ink">
                      {isToday(selectedDate) ? 'Today' : formatDate(selectedDate).split(' •')[0]}
                    </h1>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateDate('next')}
                      className="text-meld-ink/60 hover:text-meld-ink p-2"
                    >
                      <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                    </Button>
                  </div>

                  {/* Right: User Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-meld-sand rounded-full flex items-center justify-center">
                      <span className="text-meld-ink text-sm font-medium">MJ</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex">
                  {/* Zone C: Working Canvas */}
                  <main className="flex-1 min-w-0">
                    <div className="p-8">
                      <TodayModule />
                    </div>
                  </main>
                  
                  {/* Zone D: Context Dock */}
                  <ContextDock />
                </div>
              </div>
            </>
          ) : currentPage === 'log' ? (
            /* Log Module with its own header and insight dock */
            <LogModule />
          ) : currentPage === 'coach-feed' ? (
            /* CoachFeed Module - Full Page */
            <CoachFeedModule />
          ) : currentPage === 'chats' ? (
            /* Chats Module - Full Page */
            <ChatsModule />
          ) : currentPage === 'fragments' ? (
            /* Fragments Module - Full Page */
            <FragmentsModule />
          ) : currentPage === 'library' ? (
            /* Wins Vault Module - Full Page */
            <WinsVaultModule />
          ) : currentPage === 'north-star' ? (
            /* North-Star Module - Full Page */
            <NorthStarModule />
          ) : currentPage === 'me' ? (
            renderPlaceholder('Me', 'Personal profile, preferences, and account settings.')
          ) : null}
        </div>
      </div>

      {/* Global Quick-Capture FAB - now always visible on all pages */}
      <FloatingActionButton />
      
      {/* Toast notifications */}
      <Toaster position="bottom-center" />
    </div>
  );
}
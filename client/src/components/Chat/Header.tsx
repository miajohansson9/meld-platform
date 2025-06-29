import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContextType } from '~/common';
import { HeaderNewChat, OpenSidebar } from './Menus';
import { useMediaQuery } from '~/hooks';
import { useChatContext } from '~/Providers';

export default function Header() {
  const { navVisible, setNavVisible } = useOutletContext<ContextType>();
  const { conversation } = useChatContext();
  const [coachMode, setCoachMode] = useState(true);

  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  // Get conversation creation date in MELD format
  const getConversationDate = () => {
    if (conversation?.createdAt) {
      return new Date(conversation.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // Fallback to current date for new conversations
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="sticky top-0 z-10 bg-theme-cream border-b border-gray-200">
      <div className="px-4 py-4 flex justify-between">
        {/* Left side - MELD branding and navigation controls with proper alignment */}
        <div className="flex items-center space-x-4 md:pl-7 lg:pl-5 xl:pl-7">
          <img 
            src="/assets/logo-b.svg" 
            alt="MELD" 
            className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
          
          {/* Navigation controls - shown when sidebar is closed */}
          {!navVisible && (
            <div className="flex items-center gap-2">
              <OpenSidebar setNavVisible={setNavVisible} />
              <HeaderNewChat />
            </div>
          )}
          
          {/* Date display - positioned after nav controls, hidden on mobile */}
          <div className="text-theme-charcoal text-sm font-light tracking-wide ml-4 hidden md:block">
            {getConversationDate()}
          </div>
        </div>

        {/* Right side - Coach Mode Toggle */}
        <div className="flex items-center space-x-4 md:pr-7 lg:pr-5 xl:pr-7">
          
          {/* Coach Mode Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-theme-charcoal font-medium text-sm">
              Coach Mode
            </span>
            <button 
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-sage/50 ${
                coachMode ? 'bg-theme-sage' : 'bg-gray-300'
              }`}
              onClick={() => setCoachMode(!coachMode)}
              aria-label={`Coach mode is ${coachMode ? 'on' : 'off'}`}
            >
              <div 
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform duration-200 ${
                  coachMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} 
              />
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}

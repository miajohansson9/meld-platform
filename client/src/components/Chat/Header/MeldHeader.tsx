import React, { useState } from 'react';
import { useChatContext } from '~/Providers';

interface MeldHeaderProps {
  className?: string;
}

const MeldHeader: React.FC<MeldHeaderProps> = ({ className = '' }) => {
  const { conversation } = useChatContext();
  const [coachMode, setCoachMode] = useState(true);
  
  // Get conversation creation date in journal format
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
    <header className={`bg-theme-cream border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* MELD Logo and Date */}
        <div className="flex items-center space-x-6">
          <img 
            src="/assets/logo-b.svg" 
            alt="MELD" 
            className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
          <div className="font-meld text-theme-charcoal text-sm">
            {getConversationDate()}
          </div>
        </div>
        
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
    </header>
  );
};

export default MeldHeader; 
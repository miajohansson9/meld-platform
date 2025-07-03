import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import type { ContextType } from '~/common';

const MentorChatsRoute: React.FC = () => {
  // Get context from parent (Root.tsx) and pass it down to child routes
  const context = useOutletContext<ContextType>();
  
  return (
    <div className="flex-1 flex flex-col bg-meld-canvas">
      {/* Chat content area - preserves existing chat functionality */}
      <div className="flex-1 min-w-0">
        <Outlet context={context} />
      </div>
    </div>
  );
};

export default MentorChatsRoute; 
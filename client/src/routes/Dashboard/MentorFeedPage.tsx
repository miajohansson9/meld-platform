import React from 'react';
import { CoachFeedModule, HeaderBar } from '~/components/figma';

export default function MentorFeedPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header Bar - stays sticky */}
      <HeaderBar />
      
      {/* Main Content Area - scrollable */}
      <div className="flex-1 overflow-y-auto bg-meld-canvas">
        <div className="max-w-5xl mx-auto">
          <CoachFeedModule />
        </div>
      </div>
    </div>
  );
} 
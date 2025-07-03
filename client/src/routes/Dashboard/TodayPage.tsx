import React from 'react';
import { 
  TodayModule, 
  CoachFeedModule, 
  HeaderBar 
} from '~/components/figma';
import { ScrollArea } from '~/components/ui/ScrollArea';

export default function TodayPage() {
  return (
    <div className="h-full flex flex-col bg-meld-canvas">
      <HeaderBar />
      <div className="flex flex-1 p-8 gap-8 justify-center max-h-full overflow-y-auto">
        {/* Main Today Content - Scrollable with better responsive widths */}
        <div className="flex-1 min-w-0 max-w-5xl">
          <TodayModule />
        </div>
        
        {/* Right Sidebar - Sticky Coach Feed */}
        <div className="w-80 xl:w-96 bg-meld-canvas shrink-0">
          <CoachFeedModule variant="preview" maxItems={2} />
        </div>
      </div>
    </div>
  );
} 
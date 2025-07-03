import React from 'react';
import { LogModule } from '~/components/figma';

export default function LogPage() {
  return (
    <div className="h-full flex flex-col bg-meld-canvas">
      <div className="flex-1 min-h-0 max-w-8xl mx-auto w-full">
        <LogModule />
      </div>
    </div>
  );
} 
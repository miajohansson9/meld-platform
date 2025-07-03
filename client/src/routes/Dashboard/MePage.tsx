import React from 'react';
import { HeaderBar } from '~/components/figma';

export default function MePage() {
  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4 text-theme-charcoal">Me</h1>
          <p className="text-theme-charcoal/70">User profile and settings will go here.</p>
          <p className="text-sm text-theme-charcoal/50 mt-2">
            This is a placeholder page. Replace with your Figma Me module component.
          </p>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import { Outlet } from 'react-router-dom';

export default function WizardLayout() {
  return (
    <div className="min-h-screen bg-meld-canvas">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
} 
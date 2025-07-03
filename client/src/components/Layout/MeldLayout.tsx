import React from 'react';
import { cn } from '~/utils';

interface MeldLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
  contextDock?: React.ReactNode;
  showContextDock?: boolean;
}

/**
 * MeldLayout implements the four-zone sanctuary margin system:
 * - Zone A: Sanctuary Margins (48px) - Sacred whitespace on outer edges
 * - Zone B: Primary Sidebar (240px) - Navigation and brand presence  
 * - Zone C: Working Canvas (flexible) - Main content area
 * - Zone D: Context Dock (280px) - Contextual tools and insights
 */
export function MeldLayout({ 
  children, 
  className, 
  sidebar, 
  contextDock, 
  showContextDock = true 
}: MeldLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-meld-canvas", className)}>
      {/* Zone A: Sanctuary Margins - 48px padding on outer edges */}
      <div className="px-12 min-h-screen flex">
        
        {/* Zone B: Primary Sidebar - 240px fixed width */}
        {sidebar && (
          <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
            {sidebar}
          </aside>
        )}
        
        {/* Zones C & D Container */}
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 flex">
            {/* Zone C: Working Canvas - flexible main content area */}
            <main className="flex-1 min-w-0 bg-background">
              {children}
            </main>
            
            {/* Zone D: Context Dock - 280px contextual sidebar */}
            {showContextDock && contextDock && (
              <aside className="w-70 flex-shrink-0 bg-sidebar border-l border-sidebar-border">
                {contextDock}
              </aside>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default MeldLayout; 
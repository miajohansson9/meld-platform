import React, { useState } from 'react';
import { LogHeaderBar } from './LogHeaderBar';
import { EntryCard } from './EntryCard';
import { ChronicleCanvas } from './ChronicleCanvas';
import { InsightDock } from './InsightDock';
import { cn } from '~/utils';

interface LogModuleProps {
  className?: string;
}

export function LogModule({ className }: LogModuleProps) {
  const [currentMonth, setCurrentMonth] = useState('JUN 2025');
  const [filters, setFilters] = useState<{
    types: string[];
    valueTag?: string;
    search?: string;
  }>({ types: [] });

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    // In a real app, this would trigger scrolling to the first entry of that month
    console.log('Jumping to month:', month);
  };

  const handleSearch = () => {
    // In a real app, this would open a search modal or focus the search input
    console.log('Opening search...');
  };

  const handleExport = (format: 'pdf' | 'json' | 'markdown') => {
    // In a real app, this would trigger the export process
    console.log('Exporting as:', format);
  };

  const handleFiltersChange = (newFilters: {
    types: string[];
    valueTag?: string;
    search?: string;
  }) => {
    setFilters(newFilters);
  };

  const handleJumpTo = (target: string) => {
    // In a real app, this would scroll to the specific entry or date
    console.log('Jumping to:', target);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header Bar - stays sticky */}
      <LogHeaderBar
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onSearch={handleSearch}
        onExport={handleExport}
      />

      {/* Main Content Area - scrollable */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto">
        {/* Chronicle Canvas (Zone C) - with internal scrolling */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChronicleCanvas
            className="flex-1 max-h-full overflow-y-auto"
            filters={filters}
            selectedMonth={currentMonth}
          />
        </div>

        {/* Insight Dock (Zone D) - with internal scrolling */}
        <div className="flex-shrink-0">
          <InsightDock
            onFiltersChange={handleFiltersChange}
            onJumpTo={handleJumpTo}
          />
        </div>
      </div>
    </div>
  );
}

export default LogModule;
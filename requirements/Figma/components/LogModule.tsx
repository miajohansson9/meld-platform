import React, { useState } from 'react';
import { LogHeaderBar } from './LogHeaderBar';
import { ChronicleCanvas } from './ChronicleCanvas';
import { InsightDock } from './InsightDock';
import { cn } from './ui/utils';

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

  const handleExport = (format: 'pdf' | 'json') => {
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
      {/* Header Bar */}
      <LogHeaderBar
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onSearch={handleSearch}
        onExport={handleExport}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Chronicle Canvas (Zone C) */}
        <ChronicleCanvas
          className="flex-1"
          filters={filters}
          selectedMonth={currentMonth}
        />

        {/* Insight Dock (Zone D) */}
        <InsightDock
          onFiltersChange={handleFiltersChange}
          onJumpTo={handleJumpTo}
        />
      </div>
    </div>
  );
}
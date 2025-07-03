import React, { useState } from 'react';
import { ChevronDown, Search, Upload, Command, FileText, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/Popover';
import { cn } from '~/utils';

interface LogHeaderBarProps {
  className?: string;
  currentMonth?: string;
  onMonthChange?: (month: string) => void;
  onSearch?: () => void;
  onExport?: (format: 'pdf' | 'json' | 'markdown') => void;
}

const months = [
  'JAN 2025', 'FEB 2025', 'MAR 2025', 'APR 2025', 'MAY 2025', 'JUN 2025',
  'JUL 2025', 'AUG 2025', 'SEP 2025', 'OCT 2025', 'NOV 2025', 'DEC 2025'
];

export function LogHeaderBar({ 
  className, 
  currentMonth = 'JUN 2025',
  onMonthChange,
  onSearch,
  onExport
}: LogHeaderBarProps) {
  const [monthHovered, setMonthHovered] = useState(false);

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 bg-meld-canvas border-b border-gray-200", className)}>
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-meld-ink/70">Home</span>
        <span className="text-sm text-meld-ink/40">/</span>
        <span className="text-sm font-medium text-meld-ink">Log</span>
      </div>

      {/* Center: Month Selector */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost"
              className="flex items-center gap-2 text-meld-ink hover:bg-meld-graysmoke/50 font-serif text-lg relative group"
              onMouseEnter={() => setMonthHovered(true)}
              onMouseLeave={() => setMonthHovered(false)}
            >
              {currentMonth}
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-opacity duration-200",
                  monthHovered ? "opacity-100" : "opacity-0"
                )} 
                strokeWidth={2} 
              />
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Change month (⌘↑/↓)
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-32">
            {months.map((month) => (
              <DropdownMenuItem
                key={month}
                onClick={() => onMonthChange?.(month)}
                className={cn(
                  "justify-center font-serif",
                  month === currentMonth && "bg-meld-sand/20 text-meld-ink font-medium"
                )}
              >
                {month}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Export and Search */}
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-meld-ink/70 hover:text-meld-ink border-meld-graysmoke hover:border-meld-sand"
            >
              <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Export
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport?.('pdf')}
                className="w-full justify-start text-sm"
              >
                <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export as PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport?.('json')}
                className="w-full justify-start text-sm"
              >
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export as JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport?.('markdown')}
                className="w-full justify-start text-sm"
              >
                <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Export as Markdown
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSearch}
          className="p-2 hover:bg-meld-graysmoke/50 relative group"
        >
          <Search className="w-4 h-4" strokeWidth={1.5} />
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-meld-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>/</span>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}

export default LogHeaderBar;
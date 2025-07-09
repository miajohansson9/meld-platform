import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  BookOpen,
  MessageSquare,
  FileText,
  Library,
  User,
  ChevronDown,
  ChevronRight,
  Trophy,
  Map,
  Lightbulb,
  Target,
  Menu,
  X,
} from "lucide-react";
import { Button } from "~/components/ui";
import { cn } from "~/utils";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  className,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isOpen && onToggle) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isOpen, onToggle]);

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/today')) return 'today';
    if (path.includes('/log')) return 'log';
    if (path.includes('/chats')) return 'chats';
    if (path.includes('/fragments')) return 'fragments';
    if (path.includes('/mentor/feed')) return 'mentor-feed';
    if (path.includes('/north-star')) return 'north-star';
    if (path.includes('/wins-vault')) return 'wins-vault';
    if (path.includes('/me')) return 'me';
    return 'today';
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (pageId: string) => {
    switch (pageId) {
      case 'today':
        navigate('/today');
        break;
      case 'log':
        navigate('/log');
        break;
      case 'chats':
        navigate('/chats');
        break;
      case 'fragments':
        navigate('/fragments');
        break;
      case 'mentor-feed':
        navigate('/mentor/feed');
        break;
      case 'north-star':
        navigate('/library/north-star');
        break;
      case 'wins-vault':
        navigate('/library/wins-vault');
        break;
      case 'me':
        navigate('/me');
        break;
      default:
        navigate('/today');
    }
    
    // Close sidebar on mobile after navigation
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  const renderNavItem = (
    id: string,
    label: string,
    IconComponent: React.ElementType,
    isActive: boolean = false,
  ) => (
    <Button
      key={id}
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto p-3 transition-colors rounded-lg",
        isActive
          ? "bg-theme-cream text-theme-charcoal hover:bg-theme-cream hover:text-theme-charcoal font-medium"
          : "text-theme-charcoal/70 hover:bg-theme-cream hover:text-theme-charcoal",
      )}
      onClick={() => handleNavigate(id)}
    >
      <IconComponent
        className="w-5 h-5 mr-3 flex-shrink-0"
        strokeWidth={1.5}
      />
      <span>{label}</span>
    </Button>
  );

  const renderSectionHeader = (
    title: string,
    hasChevron: boolean = false,
    isExpanded: boolean = true,
    onClick?: () => void,
  ) => (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2",
        onClick &&
          "cursor-pointer hover:bg-theme-sage/10 rounded-lg transition-colors",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-theme-charcoal/70 font-medium">
          {title}
        </span>
      </div>
      {hasChevron && (
        <ChevronDown
          className={cn(
            "w-4 h-4 text-theme-charcoal/50 transition-transform",
            !isExpanded && "rotate-180",
          )}
        />
      )}
    </div>
  );

  // Don't render sidebar if it's closed on desktop
  if (!isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
          // Desktop styles
          "md:relative md:translate-x-0",
          isOpen ? "md:w-64" : "md:w-0",
          // Mobile styles
          "fixed top-0 left-0 h-full z-50 w-64",
          // Mobile visibility
          isMobile && !isOpen && "hidden",
          // Mobile transform
          isMobile && isOpen && "translate-x-0",
          className,
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-charcoal rounded-md flex items-center justify-center">
                <span className="text-white font-medium">M</span>
              </div>
              <h1 className="font-serif text-xl text-theme-charcoal">
                Meld
              </h1>
            </div>
            
            {/* Mobile close button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="md:hidden p-2 hover:bg-theme-cream"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Home Section */}
            <div>
              {renderSectionHeader("Home", true, true)}
              <div className="space-y-1">
                {renderNavItem(
                  "today",
                  "Today",
                  Calendar,
                  currentPage === "today",
                )}
                {renderNavItem(
                  "log",
                  "Log",
                  BookOpen,
                  currentPage === "log",
                )}
              </div>
            </div>

            {/* Mentor Section */}
            <div>
              {renderSectionHeader("Mentor", true, true)}
              <div className="space-y-1">
                {renderNavItem(
                  "mentor-feed",
                  "Mentor Feed",
                  Lightbulb,
                  currentPage === "mentor-feed",
                )}
                {renderNavItem(
                  "chats",
                  "Chats",
                  MessageSquare,
                  currentPage === "chats",
                )}
                {renderNavItem(
                  "fragments",
                  "Fragments",
                  FileText,
                  currentPage === "fragments",
                )}
              </div>
            </div>

            {/* Library Section */}
            <div>
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-theme-cream rounded-lg transition-colors"
                onClick={() =>
                  setIsLibraryExpanded(!isLibraryExpanded)
                }
              >
                <div className="flex items-center gap-2">
                  <Library
                    className="w-5 h-5 text-theme-charcoal/70"
                    strokeWidth={1.5}
                  />
                  <span className="text-theme-charcoal/70 font-medium">
                    Library
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-theme-charcoal/50 transition-transform",
                    !isLibraryExpanded && "-rotate-90",
                  )}
                />
              </div>
              {isLibraryExpanded && (
                <div className="space-y-1 mt-1 ml-3">
                  {renderNavItem(
                    "north-star",
                    "North-Star Map",
                    Target,
                    currentPage === "north-star",
                  )}
                  {renderNavItem(
                    "wins-vault",
                    "Wins Vault",
                    Trophy,
                    currentPage === "wins-vault",
                  )}
                </div>
              )}
            </div>

            {/* Me Section */}
            <div>
              {renderNavItem(
                "me",
                "Me",
                User,
                currentPage === "me",
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
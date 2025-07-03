import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface SidebarProps {
  className?: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({
  className,
  currentPage,
  onNavigate,
}: SidebarProps) {
  const [isLibraryExpanded, setIsLibraryExpanded] =
    useState(true);

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
          ? "bg-meld-sand text-meld-ink font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
      onClick={() => onNavigate(id)}
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
          "cursor-pointer hover:bg-sidebar-accent/30 rounded-lg transition-colors",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-sidebar-foreground/70 font-medium">
          {title}
        </span>
      </div>
      {hasChevron && (
        <ChevronDown
          className={cn(
            "w-4 h-4 text-sidebar-foreground/50 transition-transform",
            !isExpanded && "rotate-180",
          )}
        />
      )}
    </div>
  );

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-meld-ink rounded-md flex items-center justify-center">
            <span className="text-white font-medium">M</span>
          </div>
          <h1 className="font-serif text-xl text-sidebar-foreground">
            Meld
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
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
                "coach-feed",
                "Mentor Feed",
                Lightbulb,
                currentPage === "coach-feed",
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
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-sidebar-accent/30 rounded-lg transition-colors"
              onClick={() =>
                setIsLibraryExpanded(!isLibraryExpanded)
              }
            >
              <div className="flex items-center gap-2">
                <Library
                  className="w-5 h-5 text-sidebar-foreground/70"
                  strokeWidth={1.5}
                />
                <span className="text-sidebar-foreground/70 font-medium">
                  Library
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-sidebar-foreground/50 transition-transform",
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
                  "library",
                  "Wins Vault",
                  Trophy,
                  currentPage === "library",
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
  );
}
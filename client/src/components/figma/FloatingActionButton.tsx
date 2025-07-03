import React, { useState } from "react";
import {
  Plus,
  FileText,
  MessageSquare,
  Mic,
} from "lucide-react";
import { Button } from "../ui/Button";
import { toast } from "sonner";
import { cn } from "~/utils";

export function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNewFragment = () => {
    toast.success("New Fragment started", {
      duration: 2000,
      position: "bottom-center",
    });
  };

  const handleEveningReflection = () => {
    toast.success("Evening Reflection opened", {
      duration: 2000,
      position: "bottom-center",
    });
  };

  const handleVoiceNote = () => {
    toast.success("Voice Note recording started", {
      duration: 2000,
      position: "bottom-center",
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end gap-4">
        {/* Action Buttons - only visible when expanded */}
        {isExpanded && (
          <div className="flex flex-col items-end gap-4 animate-in slide-in-from-bottom-2 duration-200">
            {/* New Fragment */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleNewFragment}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl font-medium"
              >
                New Fragment
              </Button>
              <Button
                size="icon"
                onClick={handleNewFragment}
                className="w-12 h-12 bg-white hover:bg-gray-50 text-gray-800 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
              >
                <FileText
                  className="w-5 h-5"
                  strokeWidth={1.5}
                />
              </Button>
            </div>

            {/* Evening Reflection */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleEveningReflection}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl font-medium"
              >
                Evening Reflection
              </Button>
              <Button
                size="icon"
                onClick={handleEveningReflection}
                className="w-12 h-12 bg-white hover:bg-gray-50 text-gray-800 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
              >
                <MessageSquare
                  className="w-5 h-5"
                  strokeWidth={1.5}
                />
              </Button>
            </div>

            {/* Voice Note */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceNote}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl font-medium"
              >
                Voice Note
              </Button>
              <Button
                size="icon"
                onClick={handleVoiceNote}
                className="w-12 h-12 bg-white hover:bg-gray-50 text-gray-800 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
              >
                <Mic className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Main Plus Button */}
        <Button
          size="icon"
          onClick={toggleExpanded}
          className={cn(
            "w-16 h-16 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl relative",
            "bg-meld-sand hover:bg-meld-sand/90 text-meld-ink border-2 border-meld-sand/50",
          )}
        >
          <Plus
            className={cn(
              "w-6 h-6 transition-transform duration-200",
              isExpanded && "rotate-45",
            )}
            strokeWidth={2}
          />

          {/* Small help button overlay */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm">?</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

export default FloatingActionButton;
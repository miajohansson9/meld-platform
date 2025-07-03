import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import {
  Heart,
  Brain,
  Zap,
  Target,
  Users,
} from "lucide-react";

interface Dimension {
  id: string;
  label: string;
  description: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  labels: string[];
}

export default function DailyCompassModule() {
  const [dimensions, setDimensions] = useState<Dimension[]>([
    {
      id: "wellbeing",
      label: "Wellbeing",
      description: "How are you feeling overall?",
      value: 3,
      icon: Heart,
      color: "#E91E63",
      bgColor: "#FCE4EC",
      labels: ["Struggling", "Low", "Okay", "Good", "Great"],
    },
    {
      id: "energy",
      label: "Energy",
      description: "How energized do you feel?",
      value: 4,
      icon: Zap,
      color: "#FF9800",
      bgColor: "#FFF3E0",
      labels: ["Drained", "Tired", "Neutral", "Energized", "Buzzing"],
    },
    {
      id: "focus",
      label: "Focus",
      description: "How clear and focused is your mind?",
      value: 3,
      icon: Brain,
      color: "#9C27B0",
      bgColor: "#F3E5F5",
      labels: ["Scattered", "Foggy", "Okay", "Clear", "Sharp"],
    },
    {
      id: "progress",
      label: "Progress",
      description: "How much progress did you make today?",
      value: 2,
      icon: Target,
      color: "#2196F3",
      bgColor: "#E3F2FD",
      labels: ["None", "Little", "Some", "Good", "Excellent"],
    },
    {
      id: "connection",
      label: "Connection",
      description: "How connected do you feel to others?",
      value: 4,
      icon: Users,
      color: "#4CAF50",
      bgColor: "#E8F5E8",
      labels: ["Isolated", "Lonely", "Neutral", "Connected", "Fulfilled"],
    },
  ]);

  const [initialValues] = useState(() =>
    dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: dim.value }), {}),
  );

  const hasChanges = dimensions.some(
    (dim) => dim.value !== initialValues[dim.id as keyof typeof initialValues],
  );

  const handleSliderChange = (dimensionId: string, newValue: number) => {
    setDimensions((prev) =>
      prev.map((dim) =>
        dim.id === dimensionId ? { ...dim, value: newValue } : dim,
      ),
    );
  };

  const handleSave = () => {
    console.log("Saving compass ratings:", dimensions);
    // Update initial values after save
    Object.assign(
      initialValues,
      dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: dim.value }), {}),
    );
  };

  const handleViewHistory = () => {
    console.log("Opening compass history");
  };

  return (
    <div className="bg-white rounded-xl border border-meld-graysmoke/30 shadow-sm">
      <div className="p-6 border-b border-meld-graysmoke/30">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-lg text-meld-ink">Daily Compass</h2>
          <span className="text-sm text-meld-ink/60">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        <p className="text-meld-ink/60 text-sm">
          Track how you're feeling across different dimensions
        </p>
      </div>

      <div className="p-6 space-y-6">
        {dimensions.map((dimension) => (
          <div key={dimension.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg shadow-sm"
                  style={{ backgroundColor: dimension.bgColor }}
                >
                  <dimension.icon
                    className="w-5 h-5"
                    style={{ color: dimension.color }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-meld-ink text-[15px]">
                    {dimension.label}
                  </h3>
                  <p className="text-meld-ink/60 text-xs">
                    {dimension.description}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-meld-ink text-lg">
                  {dimension.value}
                </div>
                <div className="text-xs text-meld-ink/50">
                  {dimension.labels[dimension.value - 1]}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={[dimension.value]}
                onValueChange={(value) => handleSliderChange(dimension.id, value[0])}
                max={5}
                min={1}
                step={1}
                className={`daily-compass-slider ${dimension.id.toLowerCase()}-slider`}
              />
              <div className="flex justify-between text-xs text-meld-ink/40 px-1">
                {dimension.labels.map((label, index) => (
                  <span 
                    key={index}
                    className={dimension.value === index + 1 ? 'text-meld-ink/70 font-medium' : ''}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-meld-graysmoke/20">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewHistory}
            className="text-meld-ink/70 hover:text-meld-ink font-medium px-3 py-2 h-auto"
          >
            View History
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink font-medium px-4 py-2 h-auto disabled:opacity-50"
          >
            Save Rating
          </Button>
        </div>
      </div>
    </div>
  );
} 
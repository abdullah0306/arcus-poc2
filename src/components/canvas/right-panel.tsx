"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";

interface APIOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
}

interface SubOption {
  id: string;
  title: string;
  description: string;
  enabled?: boolean;
}

interface APISection {
  id: string;
  title: string;
  options: SubOption[];
}

const apiOptions: APIOption[] = [
  {
    id: "object-detection",
    title: "Object Detection",
    description: "Add exclusions and obstructions",
    enabled: false,
    icon: "⭕"
  },
  {
    id: "room-detection",
    title: "Room Detection",
    description: "Detects and identifies rooms in the space.",
    enabled: false,
    icon: "⚪"
  },
  {
    id: "doors-windows",
    title: "Doors and Windows Detection",
    description: "Identifies doors and windows in the area.",
    enabled: false,
    icon: "🚪"
  },
  {
    id: "zones",
    title: "Inclusive and Exclusive Zones Detection",
    description: "Detects accessible and restricted zones.",
    enabled: false,
    icon: "↗️"
  },
  {
    id: "walls",
    title: "Internal and External Walls Detection",
    description: "Identifies internal and external walls.",
    enabled: false,
    icon: "⭕"
  },
  {
    id: "fire-alarm",
    title: "Fire Alarm Detection",
    description: "Detects and identifies fire alarms in the space.",
    enabled: false,
    icon: "⚪"
  },
  {
    id: "room-area",
    title: "Room Area Detection",
    description: "Detects the room area of the floor.",
    enabled: false,
    icon: "↗️"
  },
  {
    id: "walls-area",
    title: "Walls Area Detection",
    description: "Detect the walls area of the room.",
    enabled: false,
    icon: "⭕"
  }
];

const doorWindowSection: APISection = {
  id: "door-window",
  title: "Door and window detection",
  options: [
    {
      id: "highlight-door",
      title: "Highlight a door",
      description: "Find and highlight one door on your plan"
    },
    {
      id: "highlight-window",
      title: "Highlight a window",
      description: "Find and highlight one window on your plan"
    },
    {
      id: "detect-remaining",
      title: "Detect remaining doors and windows",
      description: "Use AI to find all remaining objects"
    },
    {
      id: "confirm-exits",
      title: "Confirm fire exits",
      description: "Ensure all fire exits are marked correctly"
    }
  ]
};

export default function RightPanel() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="w-[280px] bg-gradient-to-b from-zinc-900 to-zinc-950 text-white border-l border-orange-900/20 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-orange-500/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <h2 className="text-sm font-medium text-orange-100">Arcus AI</h2>
        </div>
        <span className="text-xs text-orange-300">Step 1 of 4</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          {apiOptions.map((option) => (
            <div 
              key={option.id}
              className={`group transition-colors rounded-lg p-3 cursor-pointer
                ${selectedOption === option.id ? 'bg-orange-500/10' : 'hover:bg-orange-500/5'}`}
              onClick={() => setSelectedOption(option.id === selectedOption ? null : option.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-orange-100">{option.title}</h3>
                    <p className="text-xs text-orange-300/80">{option.description}</p>
                  </div>
                </div>
                <Switch 
                  checked={option.enabled}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
              
              {selectedOption === option.id && option.id === "doors-windows" && (
                <div className="mt-4 pl-8 border-l border-orange-500/20">
                  <h4 className="text-sm font-medium text-orange-100 mb-3">{doorWindowSection.title}</h4>
                  <div className="space-y-3">
                    {doorWindowSection.options.map((subOption) => (
                      <div 
                        key={subOption.id}
                        className="flex items-center gap-3 group/item hover:bg-orange-500/5 p-2 rounded-md transition-colors"
                      >
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <div>
                          <h5 className="text-sm text-orange-100">{subOption.title}</h5>
                          <p className="text-xs text-orange-300/80">{subOption.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-orange-500/10 bg-black/20">
        <button className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg text-sm font-medium">
          Next
        </button>
      </div>
    </div>
  );
}

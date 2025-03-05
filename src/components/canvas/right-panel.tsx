"use client";

import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";

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
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={cn(
      "w-[300px] border-l transition-colors",
      isDarkMode 
        ? "bg-gradient-to-b from-zinc-900 to-zinc-950 border-orange-900/20" 
        : "bg-gradient-to-b from-zinc-100 to-zinc-200 border-orange-500/20"
    )}>
      <div className={cn(
        "p-3 border-b transition-colors",
        isDarkMode 
          ? "border-orange-500/10 bg-black/20"
          : "border-orange-500/10 bg-zinc-50/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isDarkMode ? "bg-orange-500" : "bg-orange-500"
            )} />
            <h2 className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-orange-100" : "text-zinc-900"
            )}>Arcus AI</h2>
          </div>
          <span className={cn(
            "text-xs",
            isDarkMode ? "text-orange-400" : "text-orange-500"
          )}>
            Step 1 of 4
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Detection Options */}
        <div className="space-y-3">
          {/* Object Detection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚪</span>
                <span className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-orange-100" : "text-zinc-900"
                )}>
                  Object Detection
                </span>
              </div>
              <Switch className={isDarkMode ? "bg-zinc-700" : "bg-orange-500"} />
            </div>
            <p className={cn(
              "text-xs pl-7",
              isDarkMode ? "text-orange-100/70" : "text-zinc-600"
            )}>
              Add exclusions and obstructions
            </p>
          </div>

          {/* Room Detection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⬜</span>
                <span className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-orange-100" : "text-zinc-900"
                )}>
                  Room Detection
                </span>
              </div>
              <Switch className={isDarkMode ? "bg-zinc-700" : "bg-orange-500"} />
            </div>
            <p className={cn(
              "text-xs pl-7",
              isDarkMode ? "text-orange-100/70" : "text-zinc-600"
            )}>
              Detects and identifies rooms in the space.
            </p>
          </div>

          {/* Doors and Windows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚪</span>
                <span className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-orange-100" : "text-zinc-900"
                )}>
                  Doors and Windows
                </span>
              </div>
              <Switch className={isDarkMode ? "bg-zinc-700" : "bg-orange-500"} />
            </div>
            <p className={cn(
              "text-xs pl-7",
              isDarkMode ? "text-orange-100/70" : "text-zinc-600"
            )}>
              Identifies doors and windows in the area.
            </p>
          </div>

          {/* Zones Detection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">↗️</span>
                <span className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-orange-100" : "text-zinc-900"
                )}>
                  Inclusive and Exclusive Zones
                </span>
              </div>
              <Switch className={isDarkMode ? "bg-zinc-700" : "bg-orange-500"} />
            </div>
            <p className={cn(
              "text-xs pl-7",
              isDarkMode ? "text-orange-100/70" : "text-zinc-600"
            )}>
              Detects accessible and restricted zones.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "p-4 border-t transition-colors",
        isDarkMode 
          ? "border-orange-500/10 bg-black/20"
          : "border-orange-500/10 bg-zinc-50/20"
      )}>
        <button className={cn(
          "w-full py-2 rounded-lg text-sm font-medium transition-colors",
          isDarkMode
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        )}>
          Next
        </button>
      </div>
    </div>
  );
}

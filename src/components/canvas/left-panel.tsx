"use client";

import { ChevronDown, Eye, EyeOff, Plus, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { useState } from "react";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: 'group' | 'layer';
  children?: Layer[];
}

const dummyLayers: Layer[] = [
  {
    id: '1',
    name: 'Floor Plan',
    visible: true,
    locked: false,
    type: 'group',
    children: [
      {
        id: '1-1',
        name: 'Measurements',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '1-2',
        name: 'Grid',
        visible: true,
        locked: false,
        type: 'layer'
      }
    ]
  },
  {
    id: '2',
    name: 'Doors and Windows',
    visible: true,
    locked: false,
    type: 'group',
    children: [
      {
        id: '2-1',
        name: 'Entry Doors',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '2-2',
        name: 'Windows',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '2-3',
        name: 'Emergency Exits',
        visible: true,
        locked: false,
        type: 'layer'
      }
    ]
  },
  {
    id: '3',
    name: 'Rooms and Spaces',
    visible: true,
    locked: false,
    type: 'group',
    children: [
      {
        id: '3-1',
        name: 'Living Areas',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '3-2',
        name: 'Kitchen & Dining',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '3-3',
        name: 'Bedrooms',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '3-4',
        name: 'Bathrooms',
        visible: true,
        locked: false,
        type: 'layer'
      }
    ]
  },
  {
    id: '4',
    name: 'Safety Features',
    visible: true,
    locked: false,
    type: 'group',
    children: [
      {
        id: '4-1',
        name: 'Fire Alarms',
        visible: true,
        locked: false,
        type: 'layer'
      },
      {
        id: '4-2',
        name: 'Emergency Routes',
        visible: true,
        locked: false,
        type: 'layer'
      }
    ]
  }
];

const LayerItem = ({ layer, depth = 0 }: { layer: Layer; depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isDarkMode } = useThemeStore();

  return (
    <div>
      <div 
        className={cn(
          "flex items-center justify-between py-1 px-2 rounded-lg transition-colors group",
          isDarkMode
            ? "hover:bg-orange-500/10"
            : "hover:bg-orange-500/10"
        )}
        style={{ paddingLeft: `${(depth + 1) * 8}px` }}
      >
        <div className="flex items-center gap-2">
          {layer.type === 'group' && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "p-0.5 rounded transition-colors",
                isDarkMode
                  ? "hover:bg-orange-500/20"
                  : "hover:bg-orange-500/20"
              )}
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                !isExpanded && "-rotate-90",
                isDarkMode ? "text-orange-100" : "text-zinc-900"
              )} />
            </button>
          )}
          <span className={cn(
            "text-sm truncate max-w-[150px]",
            isDarkMode ? "text-orange-100" : "text-zinc-900"
          )}>
            {layer.name}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className={cn(
            "p-1 rounded transition-colors",
            isDarkMode
              ? "hover:bg-orange-500/20 text-orange-100"
              : "hover:bg-orange-500/20 text-zinc-900"
          )}>
            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <button className={cn(
            "p-1 rounded transition-colors",
            isDarkMode
              ? "hover:bg-orange-500/20 text-orange-100"
              : "hover:bg-orange-500/20 text-zinc-900"
          )}>
            <Square className="h-3 w-3" />
          </button>
        </div>
      </div>
      {layer.type === 'group' && isExpanded && layer.children && (
        <div className="ml-2">
          {layer.children.map(child => (
            <LayerItem key={child.id} layer={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function LeftPanel() {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={cn(
      "w-[300px] border-r transition-colors flex flex-col h-[calc(100vh-48px)]", 
      isDarkMode 
        ? "bg-gradient-to-b from-zinc-900 to-zinc-950 border-orange-900/20" 
        : "bg-gradient-to-b from-zinc-100 to-zinc-200 border-orange-500/20"
    )}>
      <div className={cn(
        "p-3 border-b transition-colors flex-shrink-0", 
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
            )}>Layers</h2>
          </div>
          <Plus className={cn(
            "h-4 w-4",
            isDarkMode ? "text-orange-400" : "text-orange-500"
          )} />
        </div>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto flex-grow"> 
        {dummyLayers.map(layer => (
          <LayerItem key={layer.id} layer={layer} />
        ))}
      </div>
    </div>
  );
}

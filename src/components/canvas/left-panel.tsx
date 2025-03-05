"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Square, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  type: "group" | "layer";
  children?: Layer[];
  expanded?: boolean;
}

const dummyLayers: Layer[] = [
  {
    id: "1",
    name: "Auto M...",
    type: "group",
    visible: true,
    expanded: true,
    children: [
      {
        id: "1.1",
        name: "Layer 519",
        type: "layer",
        visible: true,
      }
    ]
  },
  {
    id: "2",
    name: "Doors and ...",
    type: "group",
    visible: true,
    expanded: false,
    children: [
      {
        id: "2.1",
        name: "Layer 280",
        type: "layer",
        visible: true,
      }
    ]
  },
  {
    id: "3",
    name: "Rooms and ...",
    type: "group",
    visible: true,
    expanded: false,
    children: [
      {
        id: "3.1",
        name: "Layer 239",
        type: "layer",
        visible: true,
      }
    ]
  }
];

const LayerItem = ({ layer, depth = 0 }: { layer: Layer; depth?: number }) => {
  const [expanded, setExpanded] = useState(layer.expanded);
  const [visible, setVisible] = useState(layer.visible);

  const toggleExpanded = () => setExpanded(!expanded);
  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(!visible);
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-3 py-2 hover:bg-orange-500/10 cursor-pointer text-sm transition-colors",
          depth > 0 && "ml-4",
          layer.type === "group" && "font-medium"
        )}
        onClick={layer.type === "group" ? toggleExpanded : undefined}
      >
        {layer.type === "group" && (
          <button 
            className={cn(
              "p-0.5 rounded-md transition-all duration-200 hover:bg-orange-500/20",
              expanded && "rotate-0",
              !expanded && "-rotate-90"
            )}
          >
            <ChevronDown className="h-3.5 w-3.5 text-orange-500" />
          </button>
        )}
        {layer.type === "layer" && (
          <Square className="h-3.5 w-3.5 text-orange-300/70" />
        )}
        <span className={cn(
          "flex-1",
          layer.type === "group" ? "text-orange-100" : "text-orange-100/80"
        )}>
          {layer.name}
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleVisibility}
            className={cn(
              "p-1 rounded-md transition-colors",
              visible ? "hover:bg-orange-500/20" : "hover:bg-red-500/20"
            )}
          >
            {visible ? (
              <Eye className="h-3.5 w-3.5 text-orange-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-red-400" />
            )}
          </button>
          <button className="p-1 rounded-md hover:bg-orange-500/20 transition-colors">
            <Plus className="h-3.5 w-3.5 text-orange-400" />
          </button>
          <div className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-md text-[10px] font-medium text-white shadow-sm">
            MS
          </div>
        </div>
      </div>
      {layer.type === "group" && expanded && (
        <div className="relative">
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-orange-500/20" />
          {layer.children?.map((child) => (
            <LayerItem key={child.id} layer={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function LeftPanel() {
  return (
    <div className="w-[280px] bg-gradient-to-b from-zinc-900 to-zinc-950 text-white border-r border-orange-900/20 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-orange-500/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <h2 className="text-sm font-medium text-orange-100">Current page</h2>
        </div>
        <ChevronDown className="h-4 w-4 text-orange-400" />
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {dummyLayers.map((layer) => (
          <LayerItem key={layer.id} layer={layer} />
        ))}
      </div>
    </div>
  );
}

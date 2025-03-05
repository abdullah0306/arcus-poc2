"use client";

import { useState } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  MousePointer2, 
  Hand, 
  Square, 
  Circle, 
  Type, 
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pan', icon: Hand, label: 'Pan' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
];

export default function BottomPanel() {
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);

  const handleZoom = (type: 'in' | 'out') => {
    const change = type === 'in' ? 10 : -10;
    setZoom(prev => Math.min(Math.max(prev + change, 10), 200));
  };

  return (
    <div className="h-16 bg-gradient-to-r from-zinc-900 to-zinc-950 border-t border-orange-900/20">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section - Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "p-2 rounded-lg transition-all group relative",
                activeTool === tool.id 
                  ? "bg-orange-500/20 text-orange-400" 
                  : "hover:bg-orange-500/10 text-orange-100 hover:text-orange-400"
              )}
            >
              <tool.icon className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-zinc-800 text-orange-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        {/* Center Section - Empty for now */}
        <div className="flex-1" />

        {/* Right Section - Zoom Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
          >
            <ZoomOut className="w-4 h-4 text-orange-100 group-hover:text-orange-400" />
          </button>
          <span className="text-sm text-orange-100 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
          >
            <ZoomIn className="w-4 h-4 text-orange-100 group-hover:text-orange-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

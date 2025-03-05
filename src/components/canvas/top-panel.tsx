"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, Undo, Redo, Share2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";

const TopPanel = () => {
  const { canvas } = useCanvasStore();

  const handleExport = () => {
    if (!canvas) return;

    try {
      // Get canvas data URL with high quality settings
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'canvas-export.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting canvas:', error);
    }
  };

  return (
    <div className="h-16 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-orange-900/20">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group">
            <ChevronLeft className="w-5 h-5 text-orange-100 group-hover:text-orange-400" />
          </button>
          <div className="h-6 w-px bg-orange-500/20" />
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group disabled:opacity-50"
                    disabled>
              <Undo className="w-4 h-4 text-orange-100 group-hover:text-orange-400" />
            </button>
            <button className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group disabled:opacity-50"
                    disabled>
              <Redo className="w-4 h-4 text-orange-100 group-hover:text-orange-400" />
            </button>
          </div>
        </div>

        {/* Center Section */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-orange-100 font-medium">Untitled Project</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-100"
            variant="ghost"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <div className="h-6 w-px bg-orange-500/20" />
          <button className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group">
            <Share2 className="w-4 h-4 text-orange-100 group-hover:text-orange-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopPanel;

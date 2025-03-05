"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
        multiplier: 2 // For better quality export
      });

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'canvas-export.png';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting canvas:', error);
      // You might want to show a toast notification here
    }
  };

  return (
    <div className="h-12 w-full bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Project Info */}
      <div className="flex items-center gap-2 text-gray-700">
        <span className="font-semibold">Project</span>
        <span className="text-gray-400">|</span>
        <span className="text-sm">Untitled</span>
      </div>

      {/* Tools */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 1</button>
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 2</button>
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 3</button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleExport}
          className="flex items-center gap-2"
          variant="outline"
          disabled={!canvas}
        >
          <Download className="w-4 h-4" />
          Export as PNG
        </Button>
      </div>
    </div>
  );
};

export default TopPanel;

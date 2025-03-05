"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, Undo, Redo, Share2, Sun, Moon } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { useThemeStore } from "@/store/theme-store";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function TopPanel() {
  const { canvas } = useCanvasStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const handleExport = () => {
    if (!canvas) return;

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

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
    <div className={cn(
      "h-16 border-b transition-colors",
      isDarkMode 
        ? "bg-gradient-to-r from-zinc-900 to-zinc-950 border-orange-900/20" 
        : "bg-gradient-to-r from-zinc-100 to-zinc-200 border-orange-500/20"
    )}>
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className={cn(
            "p-2 rounded-lg transition-colors group",
            isDarkMode 
              ? "hover:bg-orange-500/10" 
              : "hover:bg-orange-500/10"
          )}>
            <ChevronLeft className={cn(
              "w-5 h-5 transition-colors",
              isDarkMode 
                ? "text-orange-100 group-hover:text-orange-400" 
                : "text-zinc-900 group-hover:text-orange-500"
            )} />
          </button>
          <div className={cn(
            "h-6 w-px",
            isDarkMode ? "bg-orange-500/20" : "bg-orange-500/20"
          )} />
          <div className="flex items-center gap-2">
            <button className={cn(
              "p-2 rounded-lg transition-colors group disabled:opacity-50",
              isDarkMode 
                ? "hover:bg-orange-500/10" 
                : "hover:bg-orange-500/10"
            )} disabled>
              <Undo className={cn(
                "w-4 h-4 transition-colors",
                isDarkMode 
                  ? "text-orange-100 group-hover:text-orange-400" 
                  : "text-zinc-900 group-hover:text-orange-500"
              )} />
            </button>
            <button className={cn(
              "p-2 rounded-lg transition-colors group disabled:opacity-50",
              isDarkMode 
                ? "hover:bg-orange-500/10" 
                : "hover:bg-orange-500/10"
            )} disabled>
              <Redo className={cn(
                "w-4 h-4 transition-colors",
                isDarkMode 
                  ? "text-orange-100 group-hover:text-orange-400" 
                  : "text-zinc-900 group-hover:text-orange-500"
              )} />
            </button>
          </div>
        </div>

        {/* Center Section */}
        <div className="flex-1 flex justify-center">
          <h1 className={cn(
            "font-medium transition-colors",
            isDarkMode ? "text-orange-100" : "text-zinc-900"
          )}>Untitled Project</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2">
            <Sun className={cn(
              "w-4 h-4 transition-colors",
              isDarkMode ? "text-orange-100/50" : "text-orange-500"
            )} />
            <Switch
              checked={isDarkMode}
              onCheckedChange={() => toggleTheme()}
              className={cn(
                isDarkMode ? "bg-orange-500" : "bg-zinc-700"
              )}
            />
            <Moon className={cn(
              "w-4 h-4 transition-colors",
              isDarkMode ? "text-orange-400" : "text-zinc-400"
            )} />
          </div>
          <div className={cn(
            "h-6 w-px",
            isDarkMode ? "bg-orange-500/20" : "bg-orange-500/20"
          )} />
          <Button 
            onClick={handleExport}
            className={cn(
              "flex items-center gap-2 transition-colors",
              isDarkMode 
                ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-100" 
                : "bg-orange-500/10 hover:bg-orange-500/20 text-zinc-900"
            )}
            variant="ghost"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <div className={cn(
            "h-6 w-px",
            isDarkMode ? "bg-orange-500/20" : "bg-orange-500/20"
          )} />
          <button className={cn(
            "p-2 rounded-lg transition-colors group",
            isDarkMode 
              ? "hover:bg-orange-500/10" 
              : "hover:bg-orange-500/10"
          )}>
            <Share2 className={cn(
              "w-4 h-4 transition-colors",
              isDarkMode 
                ? "text-orange-100 group-hover:text-orange-400" 
                : "text-zinc-900 group-hover:text-orange-500"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}

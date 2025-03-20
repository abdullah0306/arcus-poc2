"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, Undo, Redo, Share2, Sun, Moon, ChevronRight } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { useThemeStore } from "@/store/theme-store";
import { usePDFPageStore } from "@/store/pdf-page-store";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useGetCanvasProject } from "@/features/projects/api/use-get-canvas-project";
import { fabric } from 'fabric';

export default function TopPanel() {
  const { canvas } = useCanvasStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { projectId } = useParams();
  const { data: project } = useGetCanvasProject(projectId as string);
  const { currentPage, setCurrentPage } = usePDFPageStore();

  // Calculate actual page count excluding the rect object
  const actualPageCount = project?.canvasData?.pages 
    ? (project.canvasData.pages[0]?.type === 'rect' 
      ? project.canvasData.pages.length - 1 
      : project.canvasData.pages.length)
    : 0;

  useEffect(() => {
    if (project?.canvasData?.pages) {
      console.log('Project pages:', project.canvasData.pages);
      console.log('Current page:', currentPage);
      console.log('Actual page count:', actualPageCount);
    }
  }, [project, currentPage, actualPageCount]);

  const handlePageChange = async (newPage: number) => {
    if (!project?.canvasData?.pages) return;
    if (newPage < 0 || newPage >= actualPageCount) return;
    
    if (canvas) {
      // Get the actual page index (add 1 to skip the rect object)
      const pageIndex = project.canvasData.pages[0].type === 'rect' ? newPage + 1 : newPage;
      const pageData = project.canvasData.pages[pageIndex];
      
      if (typeof pageData === 'string') {
        // Legacy format - data URL string
        fabric.Image.fromURL(
          pageData,
          (img) => {
            // Calculate scale to fit while maintaining aspect ratio
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const scale = Math.min(
              (canvasWidth * 0.9) / img.width!,
              (canvasHeight * 0.9) / img.height!
            );

            // Set image properties
            img.scale(scale);
            img.set({
              left: (canvasWidth - img.width! * scale) / 2,
              top: (canvasHeight - img.height! * scale) / 2,
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              hoverCursor: 'default',
            });

            // Clear existing objects except the rect
            const existingObjects = canvas.getObjects();
            const backgroundImage = existingObjects.find(obj => !obj.selectable && obj.type !== 'rect');
            if (backgroundImage) {
              canvas.remove(backgroundImage);
            }
            canvas.add(img);
            img.sendToBack();
            
            // Make sure rect stays at the back
            const rect = existingObjects.find(obj => obj.type === 'rect');
            if (rect) {
              rect.sendToBack();
            }
            
            canvas.renderAll();
          },
          { crossOrigin: 'anonymous' }
        );
      } else if (typeof pageData === 'object' && pageData.type === 'image') {
        // New format - JSON object
        fabric.Image.fromURL(
          pageData.src,
          (img) => {
            // Calculate scale to fit while maintaining aspect ratio
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const scale = Math.min(
              (canvasWidth * 0.9) / pageData.width,
              (canvasHeight * 0.9) / pageData.height
            );

            // Set image properties
            img.scale(scale);
            img.set({
              left: (canvasWidth - pageData.width * scale) / 2,
              top: (canvasHeight - pageData.height * scale) / 2,
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              hoverCursor: 'default',
            });

            // Clear existing objects except the rect
            const existingObjects = canvas.getObjects();
            const backgroundImage = existingObjects.find(obj => !obj.selectable && obj.type !== 'rect');
            if (backgroundImage) {
              canvas.remove(backgroundImage);
            }
            canvas.add(img);
            img.sendToBack();
            
            // Make sure rect stays at the back
            const rect = existingObjects.find(obj => obj.type === 'rect');
            if (rect) {
              rect.sendToBack();
            }
            
            canvas.renderAll();
          },
          { crossOrigin: 'anonymous' }
        );
      } else {
        console.error("Unsupported page data format:", pageData);
      }
    }
    
    setCurrentPage(newPage);
  };

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
        <div className="flex-1 flex justify-center items-center gap-4">
          <button 
            className={cn(
              "p-2 rounded-lg transition-colors group",
              isDarkMode 
                ? "hover:bg-orange-500/10" 
                : "hover:bg-orange-500/10",
              !project?.canvasData?.pages || currentPage <= 0 && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!project?.canvasData?.pages || currentPage <= 0}
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-colors",
              isDarkMode 
                ? "text-orange-100 group-hover:text-orange-400" 
                : "text-zinc-900 group-hover:text-orange-500"
            )} />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className={cn(
              "font-medium transition-colors",
              isDarkMode ? "text-orange-100" : "text-zinc-900"
            )}>{project?.name || "Untitled Project"}</h1>
            {project?.canvasData?.pages && (
              <span className={cn(
                "text-sm",
                isDarkMode ? "text-orange-100/70" : "text-zinc-600"
              )}>
                Page {currentPage + 1} of {actualPageCount}
              </span>
            )}
          </div>

          <button 
            className={cn(
              "p-2 rounded-lg transition-colors group",
              isDarkMode 
                ? "hover:bg-orange-500/10" 
                : "hover:bg-orange-500/10",
              !project?.canvasData?.pages || currentPage >= actualPageCount - 1 && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!project?.canvasData?.pages || currentPage >= actualPageCount - 1}
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-colors",
              isDarkMode 
                ? "text-orange-100 group-hover:text-orange-400" 
                : "text-zinc-900 group-hover:text-orange-500"
            )} />
          </button>
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

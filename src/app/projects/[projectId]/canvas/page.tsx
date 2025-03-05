"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { ZoomIn, ZoomOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LeftPanel from "@/components/canvas/left-panel";
import RightPanel from "@/components/canvas/right-panel";

// Constants for zoom limits and steps
const MIN_ZOOM = 0.1; // 10% of original size
const MAX_ZOOM = 20; // 2000% of original size
const ZOOM_SPEED = 1.1; // 10% change per zoom step

interface PageProps {
  params: {
    projectId: string;
  };
}

export default function CanvasPage({ params }: PageProps) {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const lastPosX = useRef<number>(0);
  const lastPosY = useRef<number>(0);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas after component mount
  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      width: window.innerWidth * 0.6, // 60% of window width
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;
    canvasElementRef.current = canvas.getElement();
    setIsCanvasReady(true);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth * 0.6, // 60% of window width
        height: window.innerHeight,
      });
      canvas.requestRenderAll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isCanvasReady]);

  // Pan handlers
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current || !canvasElementRef.current) return;

    const canvas = canvasRef.current;
    const canvasElement = canvasElementRef.current;

    const handleMouseDown = (opt: fabric.IEvent) => {
      const evt = opt.e as MouseEvent;
      if (evt.altKey || evt.buttons === 2) {
        isDragging.current = true;
        canvas.selection = false;
        lastPosX.current = evt.clientX;
        lastPosY.current = evt.clientY;
        canvas.setCursor('grabbing');
      }
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDragging.current) return;

      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform!;
      
      // Calculate delta movement
      const deltaX = evt.clientX - lastPosX.current;
      const deltaY = evt.clientY - lastPosY.current;
      
      // Update viewport transform
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      
      // Update last position
      lastPosX.current = evt.clientX;
      lastPosY.current = evt.clientY;
      
      canvas.requestRenderAll();
      canvas.setCursor('grabbing');
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.selection = true;
      canvas.setCursor('default');
    };

    // Prevent context menu on right-click
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvasElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (canvasRef.current) {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      }
      if (canvasElementRef.current) {
        canvasElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [isCanvasReady]);

  // Mouse wheel zoom handler
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      
      const delta = e.deltaY;
      let currentZoom = canvas.getZoom();
      let newZoom = currentZoom;

      // Calculate new zoom
      if (delta > 0) {
        // Zoom out - faster when closer to max zoom
        const zoomFactor = Math.max(ZOOM_SPEED, 1 + (currentZoom / MAX_ZOOM) * 0.5);
        newZoom = currentZoom / zoomFactor;
      } else {
        // Zoom in - faster when closer to min zoom
        const zoomFactor = Math.max(ZOOM_SPEED, 1 + (MIN_ZOOM / currentZoom) * 0.5);
        newZoom = currentZoom * zoomFactor;
      }

      // Clamp zoom between MIN_ZOOM and MAX_ZOOM
      newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

      // Get the mouse position
      const point = {
        x: e.offsetX,
        y: e.offsetY,
      };

      // Apply zoom
      canvas.zoomToPoint(new fabric.Point(point.x, point.y), newZoom);
      setZoom(newZoom);

      // Ensure the viewport transform is updated
      canvas.requestRenderAll();
    };

    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
      canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) {
        canvasEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isCanvasReady]);

  // Load canvas content after initialization
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;

    // Fetch project data
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/canvas-projects/${params.projectId}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        
        const project = await response.json();
        
        if (project.canvasData?.pages?.[0]) {
          // Load the first page as background image
          fabric.Image.fromURL(project.canvasData.pages[0], (img) => {
            // Calculate scale to fit canvas while maintaining aspect ratio
            const scaleX = canvas.width! / img.width!;
            const scaleY = canvas.height! / img.height!;
            const scale = Math.min(scaleX, scaleY);

            img.set({
              scaleX: scale,
              scaleY: scale,
              left: (canvas.width! - img.width! * scale) / 2,
              top: (canvas.height! - img.height! * scale) / 2,
              selectable: true,
              hasControls: true
            });

            canvas.add(img);
            canvas.requestRenderAll();
          }, { crossOrigin: 'anonymous' });
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    fetchProject();
  }, [isCanvasReady, params.projectId]);

  // Handle zoom button clicks
  const handleZoom = (direction: 'in' | 'out') => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    let currentZoom = canvas.getZoom();
    let newZoom = currentZoom;

    if (direction === 'in') {
      // Zoom in - larger steps when closer to min zoom
      const zoomFactor = Math.max(ZOOM_SPEED, 1 + (MIN_ZOOM / currentZoom) * 0.5);
      newZoom = currentZoom * zoomFactor;
    } else {
      // Zoom out - larger steps when closer to max zoom
      const zoomFactor = Math.max(ZOOM_SPEED, 1 + (currentZoom / MAX_ZOOM) * 0.5);
      newZoom = currentZoom / zoomFactor;
    }
    
    // Clamp zoom between MIN_ZOOM and MAX_ZOOM
    newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    
    // Get canvas center point
    const center = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2
    };
    
    // Apply zoom to center
    canvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
    setZoom(newZoom);
    
    // Ensure the viewport transform is updated
    canvas.requestRenderAll();
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <LeftPanel />
      <div className="relative w-[60%] h-full bg-gray-50">
        <canvas id="canvas" className="absolute left-0 top-0" />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleZoom('out')}
                  className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <RightPanel />
    </div>
  );
}

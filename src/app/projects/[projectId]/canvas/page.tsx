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
      width: window.innerWidth,
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
        width: window.innerWidth,
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
  const handleZoom = (zoomIn: boolean) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    let currentZoom = canvas.getZoom();
    let newZoom = currentZoom;

    if (zoomIn) {
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
    <div ref={containerRef} className="h-screen w-screen relative bg-neutral-100">
      <canvas id="canvas" />
      
      {/* Zoom controls */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleZoom(true)}
                className="bg-white p-2 rounded-lg shadow hover:bg-gray-100 transition-colors"
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-5 w-5 text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In (Ctrl + Mouse Wheel Up)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleZoom(false)}
                className="bg-white p-2 rounded-lg shadow hover:bg-gray-100 transition-colors"
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-5 w-5 text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out (Ctrl + Mouse Wheel Down)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm text-center bg-white px-2 py-1 rounded shadow text-gray-700">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function CanvasPage() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const lastPosX = useRef<number>(0);
  const lastPosY = useRef<number>(0);

  // Initialize canvas after component mount
  useEffect(() => {
    const canvas = new fabric.Canvas(fabricCanvasRef.current!, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;
    setIsCanvasReady(true);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Handle image loading after canvas is ready
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;

    // Add the floor plan image
    fabric.Image.fromURL('/floorplan.png', (img: fabric.Image) => {
      // Set initial scale to fit 90% of the viewport
      const scaleX = (window.innerWidth * 0.9) / img.width!;
      const scaleY = (window.innerHeight * 0.9) / img.height!;
      const scale = Math.min(scaleX, scaleY);

      // Center the image
      const left = (canvas.getWidth() - img.width! * scale) / 2;
      const top = (canvas.getHeight() - img.height! * scale) / 2;

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: left,
        top: top,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true // Maintain aspect ratio when scaling
      });

      canvas.add(img);
      canvas.centerObject(img);
      canvas.requestRenderAll();
    }, {
      crossOrigin: 'anonymous'
    });

    // Handle window resize
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
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;

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
    canvas.getElement().addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.getElement().removeEventListener('contextmenu', handleContextMenu);
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

    const canvasEl = fabricCanvasRef.current;
    canvasEl?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvasEl?.removeEventListener('wheel', handleWheel);
    };
  }, [isCanvasReady]);

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
    <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden">
      <canvas ref={fabricCanvasRef} id="canvas" />
      
      {/* Zoom controls */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleZoom(true)}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In (Ctrl + Mouse Wheel Up)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleZoom(false)}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out (Ctrl + Mouse Wheel Down)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="text-sm text-center bg-white px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}

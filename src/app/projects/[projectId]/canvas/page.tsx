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
import TopPanel from "@/components/canvas/top-panel";
import BottomPanel from "@/components/canvas/bottom-panel";

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

  // Load initial canvas data
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current || !params.projectId) return;

    const loadCanvasData = async () => {
      try {
        const response = await fetch(`/api/canvas-projects/${params.projectId}`);
        if (!response.ok) return;

        const project = await response.json();
        if (project.canvasData?.pages?.length > 0) {
          handlePDFProcessed(project.canvasData.pages);
        }
      } catch (error) {
        console.error("Error loading canvas data:", error);
      }
    };

    loadCanvasData();
  }, [isCanvasReady, params.projectId]);

  // Handle adding PDF page to canvas
  const handlePDFProcessed = async (pages: string[]) => {
    if (!canvasRef.current || pages.length === 0) return;
    
    const canvas = canvasRef.current;
    const firstPage = pages[0];

    // Create a fabric.Image from the data URL
    fabric.Image.fromURL(firstPage, (img) => {
      // Calculate scale to fit the canvas while maintaining aspect ratio
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
        selectable: false, // Make image unselectable
        evented: false, // Disable all events on the image
        hasControls: false, // Remove resize controls
        hasBorders: false, // Remove borders
        lockMovementX: true, // Lock horizontal movement
        lockMovementY: true, // Lock vertical movement
        hoverCursor: 'default', // Use default cursor on hover
      });

      // Clear existing objects and add the image
      canvas.clear();
      canvas.add(img);
      
      // Send the image to the back and lock it
      img.sendToBack();
      canvas.renderAll();
    });
  };

  // Initialize canvas after component mount
  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Create a style element for our custom canvas styles
    const style = document.createElement('style');
    style.textContent = `
      .canvas-wrapper {
        transform-style: flat;
        perspective: none;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .canvas-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        transform-origin: 0 0;
      }
    `;
    document.head.appendChild(style);

    const canvas = new fabric.Canvas("canvas", {
      width: container.clientWidth,
      height: container.clientHeight,
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
      document.head.removeChild(style);
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const handleResize = () => {
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight
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
        evt.preventDefault();
        evt.stopPropagation();
      }
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDragging.current) return;

      const evt = opt.e as MouseEvent;
      evt.preventDefault();
      evt.stopPropagation();
      
      const vpt = canvas.viewportTransform!;
      const deltaX = evt.clientX - lastPosX.current;
      const deltaY = evt.clientY - lastPosY.current;
      
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      
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

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:out', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:out', handleMouseUp);
    };
  }, [isCanvasReady]);

  // Mouse wheel zoom handler
  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      
      // Only handle zoom if the event is within the canvas container
      const container = document.getElementById('canvas-container');
      if (!container?.contains(e.target as Node)) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      let currentZoom = canvas.getZoom();
      let newZoom = currentZoom;

      if (delta > 0) {
        newZoom = currentZoom / ZOOM_SPEED;
      } else {
        newZoom = currentZoom * ZOOM_SPEED;
      }

      newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

      // Get pointer position relative to canvas container
      const rect = canvas.getElement().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      canvas.zoomToPoint(new fabric.Point(x, y), newZoom);
      setZoom(newZoom);
    };

    // Attach wheel event to the canvas container instead of canvas
    const container = document.getElementById('canvas-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isCanvasReady]);

  // Handle zoom button clicks
  const handleZoom = (direction: 'in' | 'out') => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    let currentZoom = canvas.getZoom();
    let newZoom = currentZoom;

    if (direction === 'in') {
      newZoom = currentZoom * ZOOM_SPEED;
    } else {
      newZoom = currentZoom / ZOOM_SPEED;
    }
    
    newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    
    // Get canvas center point
    const center = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2
    };
    
    canvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
    setZoom(newZoom);
    canvas.requestRenderAll();
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <TopPanel />
      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        <LeftPanel />
        <div className="relative w-[60%] h-full bg-gray-50">
          <div id="canvas-container" className="absolute inset-0">
            <div className="canvas-wrapper">
              <canvas id="canvas" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
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
      <div className="w-full">
        <BottomPanel />
      </div>
    </div>
  );
}

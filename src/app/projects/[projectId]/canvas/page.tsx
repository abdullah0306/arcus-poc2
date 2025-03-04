"use client";

import { useEffect, useRef } from "react";
import { fabric } from "fabric";

export default function CanvasPage() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize canvas
    const canvas = new fabric.Canvas("canvas", {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    canvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full">
      <canvas id="canvas" />
    </div>
  );
}

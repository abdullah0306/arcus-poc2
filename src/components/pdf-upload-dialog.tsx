"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PDFUploadDialogProps {
  className?: string;
}

export function PDFUploadDialog({ className }: PDFUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupWorker = async () => {
      try {
        // Set worker source
        GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
        setIsWorkerReady(true);
      } catch (error) {
        console.error('Error loading PDF worker:', error);
        toast.error("Failed to initialize PDF processor");
      }
    };

    setupWorker();
  }, []);

  const processPage = async (page: any, scale: number = 1.5): Promise<any> => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    try {
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert to JPEG with balanced quality (0.85) for good quality while keeping size reasonable
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      // Create a fabric.js compatible JSON object
      return {
        type: "image",
        version: "5.3.0",
        originX: "left",
        originY: "top",
        left: 0,
        top: 0,
        width: viewport.width,
        height: viewport.height,
        src: dataUrl,
        crossOrigin: "anonymous",
        filters: [],
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        hoverCursor: 'default'
      };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const uploadInChunks = async (pages: any[], fileName: string) => {
    const CHUNK_SIZE = 1; // Process one page at a time
    const totalChunks = Math.ceil(pages.length / CHUNK_SIZE);
    let projectId: string | undefined;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    toast.loading("Starting upload...", { id: "upload-progress" });

    for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
      const chunk = pages.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE);
      
      while (retryCount < MAX_RETRIES) {
        try {
          // Get viewport dimensions
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          // Calculate the canvas dimensions (90% of viewport)
          const canvasWidth = width * 0.9;
          const canvasHeight = height * 0.9;
          
          // Calculate the rect dimensions and position
          const rectWidth = 1535.76;
          const rectHeight = 702;
          const left = -127.98;
          const top = -58.5;

          const response = await fetch("/api/canvas-projects", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: fileName,
              canvasData: {
                version: "1.0",
                pages: chunkIndex === 0 ? [
                  {
                    type: "rect",
                    version: "5.3.0",
                    originX: "left",
                    originY: "top",
                    left: left,
                    top: top,
                    width: rectWidth,
                    height: rectHeight,
                    fill: "white",
                    stroke: null,
                    strokeWidth: 1,
                    strokeDashArray: null,
                    strokeLineCap: "butt",
                    strokeDashOffset: 0,
                    strokeLineJoin: "miter",
                    strokeUniform: false,
                    strokeMiterLimit: 4,
                    scaleX: 1,
                    scaleY: 1,
                    angle: 0,
                    flipX: false,
                    flipY: false,
                    opacity: 1,
                    shadow: {
                      color: "rgba(0,0,0,0.8)",
                      blur: 5,
                      offsetX: 0,
                      offsetY: 0,
                      affectStroke: false,
                      nonScaling: false
                    },
                    visible: true,
                    backgroundColor: "",
                    fillRule: "nonzero",
                    paintFirst: "fill",
                    globalCompositeOperation: "source-over",
                    skewX: 0,
                    skewY: 0,
                    rx: 0,
                    ry: 0,
                    name: "clip",
                    selectable: false,
                    hasControls: false
                  },
                  ...chunk
                ] : chunk,
                currentPage: 0,
                totalChunks,
                chunkIndex,
                projectId,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to upload page ${chunkIndex + 1}`);
          }

          const result = await response.json();
          
          // Save the project ID from the first chunk
          if (chunkIndex === 0) {
            projectId = result.id;
            toast.loading("Processing PDF pages...", { id: "upload-progress" });
          }

          // Update progress
          const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
          toast.loading(`Processing: ${progress}%`, { id: "upload-progress" });
          
          // Reset retry count on success
          retryCount = 0;
          break;
        } catch (error) {
          retryCount++;
          console.error(`Error uploading chunk ${chunkIndex}, attempt ${retryCount}:`, error);
          
          if (retryCount === MAX_RETRIES) {
            toast.dismiss("upload-progress");
            throw new Error(`Failed to upload page ${chunkIndex + 1}. Please try again.`);
          }
          
          // Show retry message
          toast.loading(`Retrying page ${chunkIndex + 1}... (Attempt ${retryCount}/${MAX_RETRIES})`, {
            id: "upload-progress"
          });
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        }
      }
    }

    return projectId;
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isWorkerReady) return;

    try {
      setIsLoading(true);
      toast.loading("Reading PDF file...", { id: "upload-progress" });

      const fileName = file.name.replace(/\.pdf$/i, '');

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Please upload a PDF smaller than 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      try {
        toast.loading("Converting PDF pages...", { id: "upload-progress" });
        
        // Process pages sequentially to avoid memory issues
        const pageImages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const pageImage = await processPage(page);
          pageImages.push(pageImage);
          
          toast.loading(`Converting page ${i} of ${pdf.numPages}...`, { id: "upload-progress" });
        }
        
        // Upload pages in chunks
        const projectId = await uploadInChunks(pageImages, fileName);
        
        if (!projectId) {
          throw new Error("Failed to create project");
        }

        setIsOpen(false);
        toast.dismiss("upload-progress");
        toast.success(`Successfully processed ${pageImages.length} pages`);
        
        // Navigate to canvas
        router.push(`/projects/${projectId}/canvas`);
      } catch (pageError) {
        console.error("Error processing PDF pages:", pageError);
        throw new Error("Failed to process PDF pages. Please try a different PDF.");
      }
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      toast.dismiss("upload-progress");
      toast.error(error.message || "Failed to process PDF");
    } finally {
      setIsLoading(false);
    }
  }, [isWorkerReady, router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className={className}
        >
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Upload your project in PDF format. We&apos;ll convert it to an editable canvas project.
            Maximum file size: 50MB.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isLoading || !isWorkerReady}
            />
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing PDF...
              </div>
            )}
            {!isWorkerReady && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing PDF processor...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

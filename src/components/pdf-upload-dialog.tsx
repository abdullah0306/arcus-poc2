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

  const processPage = async (page: any, scale: number = 1.5): Promise<string> => {
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

      // Convert to JPEG with reduced quality for smaller file size
      return canvas.toDataURL("image/jpeg", 0.7);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const uploadInChunks = async (pages: string[], fileName: string) => {
    const CHUNK_SIZE = 1; // Process one page at a time to stay well within limits
    const totalChunks = Math.ceil(pages.length / CHUNK_SIZE);
    let projectId: string | undefined;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
      const chunk = pages.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE);
      
      while (retryCount < MAX_RETRIES) {
        try {
          const response = await fetch("/api/canvas-projects", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: fileName,
              canvasData: {
                version: "1.0",
                pages: chunk,
                currentPage: 0,
                totalChunks,
                chunkIndex,
                projectId,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
          }

          const result = await response.json();
          
          // Save the project ID from the first chunk
          if (chunkIndex === 0) {
            projectId = result.id;
          }

          // Update progress
          const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
          toast.loading(`Processing: ${progress}%`, { id: "upload-progress" });
          
          // Reset retry count on success
          retryCount = 0;
          break; // Exit retry loop on success
        } catch (error) {
          retryCount++;
          if (retryCount === MAX_RETRIES) {
            console.error(`Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} attempts:`, error);
            throw new Error(`Failed to upload page ${chunkIndex + 1}. Please try again.`);
          }
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
      toast.loading("Processing PDF...", { id: "upload-progress" });

      const fileName = file.name.replace(/\.pdf$/i, '');

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Please upload a PDF smaller than 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      try {
        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          pagePromises.push(processPage(page));
        }
        const pageImages = await Promise.all(pagePromises);
        
        // Upload pages in chunks
        const projectId = await uploadInChunks(pageImages, fileName);
        
        if (!projectId) {
          throw new Error("Failed to create project");
        }

        setIsOpen(false);
        toast.dismiss("upload-progress");
        toast.success("PDF processed successfully");
        
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

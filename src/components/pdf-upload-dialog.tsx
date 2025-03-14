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

interface PDFUploadDialogProps {
  onPDFProcessed: (pages: string[], fileName: string) => void;
  className?: string;
}

export function PDFUploadDialog({ onPDFProcessed, className }: PDFUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  // Constants for chunking
  const CHUNK_SIZE = 5; // Number of pages per chunk
  const MAX_PARALLEL_UPLOADS = 3; // Number of concurrent chunk uploads

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

    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    try {
      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert to high quality JPEG format
      return canvas.toDataURL("image/jpeg", 1.0);
    } finally {
      // Clean up
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const uploadProjectChunk = async (
    pages: string[],
    fileName: string,
    chunkIndex: number,
    totalChunks: number,
    projectId?: string
  ): Promise<any> => {
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
            pages,
            currentPage: 0,
            totalChunks,
            chunkIndex,
            projectId
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}:`, error);
      throw error;
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isWorkerReady) return;

    try {
      setIsLoading(true);
      toast.loading("Processing PDF...");

      // Get file name without .pdf extension
      const fileName = file.name.replace(/\.pdf$/i, '');

      // Validate file size
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error("File size too large. Please upload a PDF smaller than 100MB.");
      }

      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      try {
        // Process all pages first
        const allPages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const pageImage = await processPage(page);
          allPages.push(pageImage);
          
          // Update progress
          const progress = Math.round((i / pdf.numPages) * 100);
          toast.loading(`Processing page ${i}/${pdf.numPages} (${progress}%)`);
        }

        // Calculate chunks
        const chunks: string[][] = [];
        for (let i = 0; i < allPages.length; i += CHUNK_SIZE) {
          chunks.push(allPages.slice(i, i + CHUNK_SIZE));
        }

        let projectId: string | undefined;
        
        // Upload chunks with controlled concurrency
        for (let i = 0; i < chunks.length; i += MAX_PARALLEL_UPLOADS) {
          const chunkPromises = chunks.slice(i, i + MAX_PARALLEL_UPLOADS).map((chunk, index) => {
            const actualIndex = i + index;
            return uploadProjectChunk(chunk, fileName, actualIndex, chunks.length, projectId);
          });

          const results = await Promise.all(chunkPromises);
          
          // Store the project ID from the first chunk
          if (i === 0) {
            projectId = results[0].id;
          }

          // Update upload progress
          const progress = Math.round(((i + MAX_PARALLEL_UPLOADS) / chunks.length) * 100);
          toast.loading(`Uploading chunks... ${Math.min(progress, 100)}%`);
        }

        setIsOpen(false);
        toast.dismiss();
        toast.success("PDF processed successfully");
        
        // Call the callback with the project ID for navigation
        if (projectId) {
          onPDFProcessed([], fileName); // We pass empty pages since they're already uploaded
        }
      } catch (pageError) {
        console.error("Error processing PDF pages:", pageError);
        throw new Error("Failed to process PDF pages. Please try a different PDF.");
      }
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to process PDF");
    } finally {
      setIsLoading(false);
    }
  }, [isWorkerReady, onPDFProcessed]);

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
            Maximum file size: 100MB.
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

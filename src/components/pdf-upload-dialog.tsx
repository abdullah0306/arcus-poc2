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
import * as pdfjsLib from "pdfjs-dist";

interface PDFUploadDialogProps {
  onPDFProcessed: (pages: string[]) => void;
}

export function PDFUploadDialog({ onPDFProcessed }: PDFUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupWorker = async () => {
      try {
        // Initialize PDF.js worker using unpkg CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
        setIsWorkerReady(true);
      } catch (error) {
        console.error('Error loading PDF worker:', error);
      }
    };

    setupWorker();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isWorkerReady) return;

    try {
      setIsLoading(true);

      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Process first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      
      // Create canvas to render the page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert to SVG-like format that fabric.js can handle
      const svgData = canvas.toDataURL("image/png");
      onPDFProcessed([svgData]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error processing PDF:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isWorkerReady, onPDFProcessed]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Upload PDF</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Upload your project in PDF format. We&apos;ll convert it to an editable canvas project.
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

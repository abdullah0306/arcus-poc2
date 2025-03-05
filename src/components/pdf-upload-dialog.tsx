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
}

export function PDFUploadDialog({ onPDFProcessed }: PDFUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

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

  const processPage = async (page: any, scale: number = 0.5): Promise<string> => {
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

      // Convert to compressed JPEG format
      return canvas.toDataURL("image/jpeg", 0.7);
    } finally {
      // Clean up
      canvas.width = 0;
      canvas.height = 0;
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
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error("File size too large. Please upload a PDF smaller than 50MB.");
      }

      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      // Process first page with error handling
      try {
        const page = await pdf.getPage(1);
        const pageData = await processPage(page);
        onPDFProcessed([pageData], fileName);
        setIsOpen(false);
        toast.dismiss();
        toast.success("PDF processed successfully");
      } catch (pageError) {
        console.error("Error processing PDF page:", pageError);
        throw new Error("Failed to process PDF page. Please try a different PDF.");
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
        <Button variant="outline">Upload PDF</Button>
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

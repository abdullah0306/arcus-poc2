"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { PDFUploadDialog } from "@/components/pdf-upload-dialog";

interface CanvasProject {
  id: string;
  name: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch("/api/canvas-projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/canvas-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Untitled Project",
        }),
      });

      if (response.ok) {
        const project = await response.json();
        toast.success("Project created successfully");
        router.push(`/projects/${project.id}/canvas`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFProcessed = async (pages: string[]) => {
    try {
      // Save the first page data to the database
      const response = await fetch("/api/canvas-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Project",
          canvasData: {
            version: "1.0",
            pages: pages,
            currentPage: 0
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      
      // Navigate to the canvas page with the new project
      router.push(`/projects/${project.id}/canvas`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Heading
          title="My Projects"
          description="View and manage all your design projects"
        />
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateProject} size="sm" disabled={isLoading}>
            {isLoading ? (
              <Spinner className="mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
          <PDFUploadDialog onPDFProcessed={handlePDFProcessed} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoadingProjects ? (
          <div className="col-span-full flex justify-center items-center min-h-[200px]">
            <Spinner className="h-6 w-6" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No projects yet. Create your first project to get started.
          </div>
        ) : (
          projects.map((project) => (
            <Card 
              key={project.id}
              className="cursor-pointer hover:opacity-75 transition"
              onClick={() => router.push(`/projects/${project.id}/canvas`)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm truncate">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Created {format(new Date(project.createdAt), "MMM d, yyyy")}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface CanvasProject {
  id: string;
  name: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/canvas-projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
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
        router.push(`/projects/${project.id}/canvas`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Heading
          title="My Projects"
          description="View and manage all your design projects"
        />
        <Button onClick={handleCreateProject} size="sm" disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
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
        ))}
      </div>
    </div>
  );
}

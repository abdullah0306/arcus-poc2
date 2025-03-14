import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 300; // Increased to 300 seconds for large file processing
export const dynamic = 'force-dynamic';

// Configure body size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
};

interface CanvasData {
  version: string;
  pages: string[];
  currentPage: number;
  totalChunks?: number;
  chunkIndex?: number;
  projectId?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name = "Untitled Project", canvasData = {} } = body;

    // Validate canvasData structure
    if (canvasData.pages && !Array.isArray(canvasData.pages)) {
      return new NextResponse("Invalid canvas data format", { status: 400 });
    }

    // Create default canvas data
    const defaultCanvasData: CanvasData = {
      version: "1.0",
      pages: [],
      currentPage: 0,
    };

    // Implement chunking for large files
    // If totalChunks is provided, we're handling a large file in chunks
    const isChunkedUpload = canvasData.totalChunks && canvasData.chunkIndex !== undefined && canvasData.projectId;
    
    // Merge with provided data
    const finalCanvasData: CanvasData = {
      ...defaultCanvasData,
      ...canvasData,
      pages: canvasData.pages || defaultCanvasData.pages,
      currentPage: canvasData.currentPage || defaultCanvasData.currentPage,
      version: canvasData.version || defaultCanvasData.version,
      totalChunks: canvasData.totalChunks,
      chunkIndex: canvasData.chunkIndex,
    };

    // Validate payload size
    const payloadSize = JSON.stringify(finalCanvasData).length;
    if (payloadSize > 50 * 1024 * 1024) { // 50MB limit
      return new NextResponse("Payload too large", { status: 413 });
    }

    // Create project with validated data
    let canvasProject;
    if (isChunkedUpload) {
      // If this is a chunked upload, we need to find the existing project and update it
      const existingProjects = await db
        .select()
        .from(canvasProjects)
        .where(eq(canvasProjects.id, canvasData.projectId));

      if (!existingProjects || existingProjects.length === 0) {
        return new NextResponse("Project not found", { status: 404 });
      }

      const existingProject = existingProjects[0];
      const existingPages = existingProject.canvasData?.pages || [];
      
      // Update the project with the new chunk, merging pages
      const updatedPages = [...existingPages];
      canvasData.pages.forEach((page: string, idx: number) => {
        const pageIndex = (canvasData.chunkIndex || 0) * 2 + idx; // Using chunk size of 2
        updatedPages[pageIndex] = page;
      });

      const updatedCanvasData = {
        ...finalCanvasData,
        pages: updatedPages,
      };
      
      await db
        .update(canvasProjects)
        .set({ canvasData: updatedCanvasData })
        .where(eq(canvasProjects.id, canvasData.projectId));
      
      // Fetch the updated project
      const updatedProjects = await db
        .select()
        .from(canvasProjects)
        .where(eq(canvasProjects.id, canvasData.projectId));
      
      canvasProject = updatedProjects[0];
    } else {
      // If this is not a chunked upload, we can create a new project
      const insertedProjects = await db
        .insert(canvasProjects)
        .values({
          name,
          userId: session.user.id,
          canvasData: finalCanvasData,
        })
        .returning();

      canvasProject = insertedProjects[0];
    }

    return NextResponse.json(canvasProject);
  } catch (error) {
    console.error("[CANVAS_PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userProjects = await db
      .select({
        id: canvasProjects.id,
        name: canvasProjects.name,
        createdAt: canvasProjects.createdAt,
        updatedAt: canvasProjects.updatedAt,
      })
      .from(canvasProjects)
      .where(eq(canvasProjects.userId, session.user.id))
      .orderBy(canvasProjects.createdAt);

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("[CANVAS_PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

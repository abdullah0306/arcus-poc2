import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

interface CanvasData {
  version: string;
  pages: string[];
  currentPage: number;
  totalChunks?: number;
  chunkIndex?: number;
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

    // Create project with validated data
    const canvasProject = await db
      .insert(canvasProjects)
      .values({
        name,
        userId: session.user.id,
        canvasData: finalCanvasData,
      })
      .returning();

    return NextResponse.json(canvasProject[0]);
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

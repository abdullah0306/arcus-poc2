import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Set to 60 seconds for Vercel hobby plan
export const dynamic = 'force-dynamic';

interface CanvasData {
  version: string;
  pages: string[];
  currentPage: number;
  totalChunks?: number;
  chunkIndex?: number;
  projectId?: string;
  complete_doors_and_windows: string[];
  single_doors: string[];
  double_doors: string[];
  windows: string[];
  single_doors_and_windows: string[];
  single_doors_and_double_doors: string[];
  double_doors_and_windows: string[];
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const project = await db
      .select()
      .from(canvasProjects)
      .where(
        and(
          eq(canvasProjects.id, params.projectId),
          eq(canvasProjects.userId, session.user.id)
        )
      )
      .limit(1);

    if (!project[0]) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(project[0]);
  } catch (error) {
    console.error("[CANVAS_PROJECT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, canvasData } = body;

    // Create default canvas data
    const defaultCanvasData: CanvasData = {
      version: "1.0",
      pages: [],
      currentPage: 0,
      complete_doors_and_windows: [],
      single_doors: [],
      double_doors: [],
      windows: [],
      single_doors_and_windows: [],
      single_doors_and_double_doors: [],
      double_doors_and_windows: [],
    };

    // Merge with provided data if it exists
    const finalCanvasData: CanvasData = canvasData 
      ? {
          ...defaultCanvasData,
          ...canvasData,
          pages: canvasData.pages || defaultCanvasData.pages,
          currentPage: canvasData.currentPage || defaultCanvasData.currentPage,
          version: canvasData.version || defaultCanvasData.version,
          complete_doors_and_windows: canvasData.complete_doors_and_windows || [],
          single_doors: canvasData.single_doors || [],
          double_doors: canvasData.double_doors || [],
          windows: canvasData.windows || [],
          single_doors_and_windows: canvasData.single_doors_and_windows || [],
          single_doors_and_double_doors: canvasData.single_doors_and_double_doors || [],
          double_doors_and_windows: canvasData.double_doors_and_windows || [],
        } 
      : defaultCanvasData;

    const updatedProject = await db
      .update(canvasProjects)
      .set({
        name: name,
        canvasData: finalCanvasData,
      })
      .where(
        and(
          eq(canvasProjects.id, params.projectId),
          eq(canvasProjects.userId, session.user.id)
        )
      )
      .returning();

    if (!updatedProject[0]) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error("[CANVAS_PROJECT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db
      .delete(canvasProjects)
      .where(
        and(
          eq(canvasProjects.id, params.projectId),
          eq(canvasProjects.userId, session.user.id)
        )
      );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CANVAS_PROJECT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

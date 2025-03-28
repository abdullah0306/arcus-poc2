import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CanvasData } from "@/types/canvas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId, layerId, visible, currentPage } = await request.json();
    
    if (!projectId || !layerId || typeof visible !== 'boolean' || typeof currentPage !== 'number') {
      return new NextResponse("Invalid request parameters", { status: 400 });
    }

    // Get the project
    const projects = await db
      .select()
      .from(canvasProjects)
      .where(eq(canvasProjects.id, projectId));

    if (!projects || projects.length === 0) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const project = projects[0];
    const canvasData = project.canvasData as CanvasData;

    // Get the URL from the appropriate array
    let imageUrl: string | undefined;
    
    if (visible) {
      // Check if the layer exists and has the correct type
      const layerArray = canvasData[layerId] as string[];
      if (Array.isArray(layerArray) && currentPage >= 0 && currentPage < layerArray.length) {
        imageUrl = layerArray[currentPage];
      }
    }

    // Fallback to pages array if no valid image found
    if (!imageUrl) {
      const pagesArray = canvasData.pages as string[];
      if (Array.isArray(pagesArray) && currentPage >= 0 && currentPage < pagesArray.length) {
        imageUrl = pagesArray[currentPage];
      }
    }

    if (!imageUrl) {
      return new NextResponse("No valid image found", { status: 404 });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      layerId,
      visible
    });
  } catch (error) {
    console.error("Error in layer visibility:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update layer visibility" 
      },
      { status: 500 }
    );
  }
}

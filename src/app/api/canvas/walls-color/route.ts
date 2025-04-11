import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/db/cloudinary-upload";
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

    const { projectId, imageUrl, currentPage } = await request.json();
    
    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    if (typeof currentPage !== 'number') {
      return new NextResponse("Current page must be a number", { status: 400 });
    }

    // 1. Get the project first to check if we already have a cloudinary URL
    const projects = await db
      .select()
      .from(canvasProjects)
      .where(eq(canvasProjects.id, projectId));

    if (!projects || projects.length === 0) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const project = projects[0];
    const canvasData = project.canvasData as CanvasData;
    
    // Use existing cloudinary URL if available for the current page
    let cloudinaryUrl = canvasData.pages[currentPage];
    
    // If no cloudinary URL exists for this page, upload the image
    if (!cloudinaryUrl && imageUrl) {
      cloudinaryUrl = await uploadToCloudinary(imageUrl);
    }
    
    if (!cloudinaryUrl) {
      return new NextResponse("No image URL available for processing", { status: 400 });
    }

    // 3. Call the external API for walls color detection
    const apiResponse = await fetch('https://bed4-103-203-45-199.ngrok-free.app/arcus/wall_color', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: cloudinaryUrl }),
    });

    if (!apiResponse.ok) {
      throw new Error(`API request failed with status: ${apiResponse.status}`);
    }

    const wallsColorResult = await apiResponse.json();

    // 4. Update the project with the new canvas data
    const updatedCanvasData: CanvasData = {
      ...canvasData,
      pages: [...canvasData.pages],
      walls_color: canvasData.walls_color || []
    };

    // Replace current page's image in walls_color array
    if (currentPage >= 0 && currentPage < canvasData.pages.length) {
      // Make sure the original page URL is saved
      if (!updatedCanvasData.pages[currentPage]) {
        updatedCanvasData.pages[currentPage] = cloudinaryUrl;
      }
      
      // Update walls_color array with the detection result
      updatedCanvasData.walls_color[currentPage] = wallsColorResult.wall_color_link;
    }

    await db
      .update(canvasProjects)
      .set({
        canvasData: updatedCanvasData
      })
      .where(eq(canvasProjects.id, projectId));

    // 5. Return the updated project data
    return NextResponse.json({
      success: true,
      cloudinaryUrl,
      wallsColorResult
    });
  } catch (error) {
    console.error("Error in walls color detection:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process image" 
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/db/cloudinary-upload";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CanvasData } from "@/types/canvas";

interface DetectionResults {
  doors: string[];
  windows: string[];
  processingTime: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId, imageUrl } = await request.json();
    
    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    // 1. Convert base64 to Cloudinary URL
    const cloudinaryUrl = await uploadToCloudinary(imageUrl);
    
    // 2. Get the project
    const projects = await db
      .select()
      .from(canvasProjects)
      .where(eq(canvasProjects.id, projectId));

    if (!projects || projects.length === 0) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const project = projects[0];
    const canvasData = project.canvasData as CanvasData;

    // 3. Update the project with the new canvas data
    // Keep the original cloudinary URL in pages array
    // Create new arrays with the same URL for now
    const updatedCanvasData: CanvasData = {
      ...canvasData,
      pages: [...canvasData.pages],
      complete_doors_and_windows: canvasData.complete_doors_and_windows || [],
      single_doors: canvasData.single_doors || [],
      double_doors: canvasData.double_doors || [],
      windows: canvasData.windows || [],
      single_doors_and_windows: canvasData.single_doors_and_windows || [],
      single_doors_and_double_doors: canvasData.single_doors_and_double_doors || [],
      double_doors_and_windows: canvasData.double_doors_and_windows || []
    };

    // Replace current page's image in all arrays
    const currentPage = canvasData.currentPage;
    if (currentPage >= 0 && currentPage < canvasData.pages.length) {
      // Update pages array with cloudinary URL
      updatedCanvasData.pages[currentPage] = cloudinaryUrl;
      
      // Update all other arrays with the same URL
      updatedCanvasData.complete_doors_and_windows[currentPage] = cloudinaryUrl;
      updatedCanvasData.single_doors[currentPage] = cloudinaryUrl;
      updatedCanvasData.double_doors[currentPage] = cloudinaryUrl;
      updatedCanvasData.windows[currentPage] = cloudinaryUrl;
      updatedCanvasData.single_doors_and_windows[currentPage] = cloudinaryUrl;
      updatedCanvasData.single_doors_and_double_doors[currentPage] = cloudinaryUrl;
      updatedCanvasData.double_doors_and_windows[currentPage] = cloudinaryUrl;
    }

    await db
      .update(canvasProjects)
      .set({
        canvasData: updatedCanvasData
      })
      .where(eq(canvasProjects.id, projectId));

    // 4. Return the updated project data
    const updatedProject = await db
      .select()
      .from(canvasProjects)
      .where(eq(canvasProjects.id, projectId));

    console.log("Cloudinary URL:", cloudinaryUrl);
    
    return NextResponse.json({
      success: true,
      cloudinaryUrl,
      detectionResults: {
        doors: [],
        windows: [],
        processingTime: "0.00s"
      }
    });
  } catch (error) {
    console.error("Error in doors-windows detection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}

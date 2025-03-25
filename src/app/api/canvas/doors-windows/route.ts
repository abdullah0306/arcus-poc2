import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/db/cloudinary-upload";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const canvasData = project.canvasData as {
      version: string;
      pages: string[];
      currentPage: number;
    };

    // 3. Replace the current page's base64 image with Cloudinary URL
    const updatedPages = [...canvasData.pages];
    updatedPages[canvasData.currentPage] = cloudinaryUrl;

    // 4. Update the project with the new canvas data
    await db
      .update(canvasProjects)
      .set({
        canvasData: {
          ...canvasData,
          pages: updatedPages
        }
      })
      .where(eq(canvasProjects.id, projectId));

    // 5. Return the updated project data
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

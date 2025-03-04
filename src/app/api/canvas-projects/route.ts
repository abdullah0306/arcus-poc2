import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name = "Untitled Project" } = await req.json();

    const canvasProject = await db
      .insert(canvasProjects)
      .values({
        name,
        userId: session.user.id,
        canvasData: JSON.stringify({}), // Initial empty canvas data
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
      .select()
      .from(canvasProjects)
      .where(eq(canvasProjects.userId, session.user.id))
      .orderBy(canvasProjects.createdAt);

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("[CANVAS_PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

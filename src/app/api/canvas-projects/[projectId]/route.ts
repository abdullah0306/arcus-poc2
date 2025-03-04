import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canvasProjects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    const { name, canvasData } = await req.json();

    const updatedProject = await db
      .update(canvasProjects)
      .set({
        name: name,
        canvasData: canvasData ? JSON.stringify(canvasData) : undefined,
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

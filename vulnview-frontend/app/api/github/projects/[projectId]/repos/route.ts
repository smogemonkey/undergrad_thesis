import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

interface ExtendedSession extends Session {
  accessToken?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/github/projects/${params.projectId}/repos`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[REPOSITORIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { owner, repo } = body;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/github/projects/${params.projectId}/repos?owner=${owner}&repo=${repo}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to connect repository");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[REPOSITORIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId");

    if (!repositoryId) {
      return new NextResponse("Repository ID is required", { status: 400 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/github/projects/${params.projectId}/repos/${repositoryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete repository");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[REPOSITORIES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
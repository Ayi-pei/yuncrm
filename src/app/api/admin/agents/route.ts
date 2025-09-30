import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";

export async function GET() {
  try {
    const agents = await mockApi.getAgents();
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

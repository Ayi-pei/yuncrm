import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> } // 👈 注意这里是 Promise
) {
  try {
    console.log("API route called with context:", context);
    // ✅ 先 await 再解构
    const { agentId } = await context.params;
    console.log("Extracted agentId:", agentId);

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: agentId" },
        { status: 400 }
      );
    }

    const data = await mockApi.getAgentData(agentId);
    console.log("Data from mockApi.getAgentData:", data);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "未找到坐席或无可用数据" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知服务器错误",
      },
      { status: 500 }
    );
  }
}

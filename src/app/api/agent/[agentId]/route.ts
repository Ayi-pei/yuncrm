import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> }   // 👈 注意这里是 Promise
) {
  try {
    // ✅ 先 await 再解构
    const { agentId } = await context.params;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: agentId" },
        { status: 400 }
      );
    }

    const data = await mockApi.getAgentData(agentId);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "未找到坐席或无可用数据" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "未知服务器错误" 
      },
      { status: 500 }
    );
  }
}

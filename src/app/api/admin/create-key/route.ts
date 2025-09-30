import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";
import { UserRole } from "@/lib/types";

// 定义请求体的类型
interface CreateKeyRequestBody {
  name: string;
  key_type: UserRole;
  notes?: string;
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "请求头必须包含 Content-Type: application/json",
        },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    let body: CreateKeyRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "请求体格式错误，必须是有效的JSON格式" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { name, key_type, notes } = body || {};
    if (!name || !key_type) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: name, key_type" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const newKey = await mockApi.createAccessKey({ name, key_type, notes });
    return NextResponse.json(
      { success: true, data: newKey },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("创建密钥时出错:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

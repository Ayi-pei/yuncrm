import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";
import { User } from "@/lib/types";

// 定义请求体的类型
interface LoginRequestBody {
  key: string;
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
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    let body: LoginRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "请求体格式错误，必须是有效的JSON格式",
        },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { key } = body || {};
    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: key" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const user = await mockApi.loginWithKey(key);
    if (!user) {
      return NextResponse.json(
        { success: false, error: `密钥无效、过期或未激活: ${key}` },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(
      { success: true, data: user as User },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("登录时出错:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "登录失败: " + (error instanceof Error ? error.message : "未知错误"),
      },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

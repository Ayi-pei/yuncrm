import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";

export async function GET() {
  try {
    const keys = await mockApi.getAccessKeys();
    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body || {};
    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: id, updates" },
        { status: 400 }
      );
    }
    const updated = await mockApi.updateAccessKey(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "未找到密钥或更新失败" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段: id" },
        { status: 400 }
      );
    }
    const ok = await mockApi.deleteAccessKey(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "未找到密钥或删除失败" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

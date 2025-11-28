import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendSmsCode, isSmsVerificationEnabled } from "@/lib/sms";

const sendCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
});

// POST: 发送短信验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = sendCodeSchema.parse(body);

    // 如果未开启短信验证，返回提示
    if (!isSmsVerificationEnabled()) {
      return NextResponse.json({
        success: true,
        message: "当前为免验证码模式，直接登录即可",
        skipVerification: true,
      });
    }

    // 发送验证码
    const result = await sendSmsCode(phone);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      skipVerification: false,
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message ?? "数据校验失败" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}

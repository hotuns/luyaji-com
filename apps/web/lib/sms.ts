/**
 * 阿里云短信服务模块
 * 
 * 使用前需要：
 * 1. 安装依赖：pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client
 * 2. 在阿里云控制台创建短信签名和模板
 * 3. 配置环境变量：
 *    - ALIYUN_SMS_ACCESS_KEY_ID
 *    - ALIYUN_SMS_ACCESS_KEY_SECRET
 *    - ALIYUN_SMS_SIGN_NAME
 *    - ALIYUN_SMS_TEMPLATE_CODE
 * 4. 将 SMS_VERIFICATION_ENABLED 设置为 "true"
 */

import { prisma } from "@/lib/prisma";

// 是否启用短信验证
export const isSmsVerificationEnabled = () => {
  return process.env.SMS_VERIFICATION_ENABLED === "true";
};

/**
 * 生成随机验证码
 */
export function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @returns 发送结果
 */
export async function sendSmsCode(phone: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 检查发送频率限制（1分钟内只能发送1次）
    const recentCode = await prisma.smsVerification.findFirst({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 1分钟内
        },
      },
    });

    if (recentCode) {
      return {
        success: false,
        message: "发送过于频繁，请稍后再试",
      };
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

    // 存储验证码到数据库
    await prisma.smsVerification.create({
      data: {
        phone,
        code,
        type: "login",
        expires,
      },
    });

    // TODO: 接入阿里云短信服务
    // 当前为开发模式，打印验证码到控制台
    if (!isSmsVerificationEnabled()) {
      console.log(`[DEV] 手机号 ${phone} 的验证码是: ${code}`);
      return {
        success: true,
        message: "验证码已发送（开发模式）",
      };
    }

    // 生产环境：调用阿里云短信 API
    const result = await sendAliyunSms(phone, code);
    return result;
  } catch (error) {
    console.error("发送短信失败:", error);
    return {
      success: false,
      message: "发送失败，请稍后重试",
    };
  }
}

/**
 * 验证短信验证码
 * @param phone 手机号
 * @param code 验证码
 * @returns 验证结果
 */
export async function verifySmsCode(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const verification = await prisma.smsVerification.findFirst({
      where: {
        phone,
        code,
        used: false,
        expires: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return {
        success: false,
        message: "验证码错误或已过期",
      };
    }

    // 标记验证码为已使用
    await prisma.smsVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return {
      success: true,
      message: "验证成功",
    };
  } catch (error) {
    console.error("验证失败:", error);
    return {
      success: false,
      message: "验证失败，请稍后重试",
    };
  }
}

/**
 * 调用阿里云短信 API 发送验证码
 * @param phone 手机号
 * @param code 验证码
 */
async function sendAliyunSms(phone: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 动态导入阿里云 SDK（需要先安装依赖）
    // pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client
    
    const Dysmsapi20170525 = (await import("@alicloud/dysmsapi20170525")).default;
    const OpenApi = await import("@alicloud/openapi-client");

    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
    });
    config.endpoint = "dysmsapi.aliyuncs.com";

    const client = new Dysmsapi20170525(config);
    const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.ALIYUN_SMS_SIGN_NAME || "路亚记",
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || "",
      templateParam: JSON.stringify({ code }),
    });

    const result = await client.sendSms(sendSmsRequest);

    if (result.body.code === "OK") {
      return {
        success: true,
        message: "验证码已发送",
      };
    } else {
      console.error("阿里云短信发送失败:", result.body);
      return {
        success: false,
        message: result.body.message || "发送失败",
      };
    }
  } catch (error) {
    console.error("阿里云短信 API 调用失败:", error);
    
    // 如果是因为没有安装依赖，给出提示
    if ((error as Error).message?.includes("Cannot find module")) {
      console.log("提示: 需要安装阿里云短信 SDK");
      console.log("运行: pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client");
    }
    
    return {
      success: false,
      message: "短信服务暂不可用",
    };
  }
}

/**
 * 清理过期的验证码记录
 * 可以在定时任务中调用
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.smsVerification.deleteMany({
    where: {
      OR: [
        { expires: { lt: new Date() } },
        { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  return result.count;
}

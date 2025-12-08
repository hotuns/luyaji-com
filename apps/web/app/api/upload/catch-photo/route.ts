import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OSS from "ali-oss";

export const config = {
  api: {
    bodyParser: false,
  },
};

// 允许的图片类型（包括 iOS HEIC 格式，前端会转换）
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// 也检查文件扩展名（有时 blob 类型可能为空）
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const OSS_BUCKET_NAME = process.env.OSS_BUCKET_NAME || "the-weapplyj";
const OSS_ENDPOINT = process.env.OSS_ENDPOINT || "http://oss-cn-beijing.aliyuncs.com";
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || "";
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || "";

const regionMatch = OSS_ENDPOINT.match(/oss-([a-z0-9-]+)\.aliyuncs\.com/);
const OSS_REGION = regionMatch ? `oss-${regionMatch[1]}` : "oss-cn-beijing";

const ossClient = new OSS({
  region: OSS_REGION,
  accessKeyId: OSS_ACCESS_KEY_ID,
  accessKeySecret: OSS_ACCESS_KEY_SECRET,
  bucket: OSS_BUCKET_NAME,
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderInput = (formData.get("folder") as string | null)?.trim().toLowerCase();
    const allowedFolders = ["catches", "combos"];
    const targetFolder = folderInput && allowedFolders.includes(folderInput) ? folderInput : "catches";

    if (!file) {
      return NextResponse.json({ success: false, error: "没有上传文件" }, { status: 400 });
    }

    // 验证文件类型（检查 MIME type 或扩展名）
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!isValidType) {
      console.log("不支持的文件类型:", file.type, "扩展名:", ext);
      return NextResponse.json({ success: false, error: `不支持的文件类型: ${file.type || ext}` }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "文件大小超过限制（10MB）" }, { status: 400 });
    }

    if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "OSS 配置缺失" }, { status: 500 });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExt = ext || "jpg";
    const objectKey = `${targetFolder}/${session.user.id}_${timestamp}_${randomId}.${fileExt}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await ossClient.put(objectKey, buffer);
    const url = (result.url || "").replace("http://", "https://");

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error("上传文件失败:", error);
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}

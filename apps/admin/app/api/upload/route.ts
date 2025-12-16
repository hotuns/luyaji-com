import { NextRequest, NextResponse } from "next/server";
import OSS from "ali-oss";

import { requireAdmin } from "@/lib/admin-auth";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

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
  const admin = await requireAdmin();
  if (!admin.success) {
    return NextResponse.json({ success: false, error: admin.error }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderInput = (formData.get("folder") as string | null)?.trim().toLowerCase();
    const allowedFolders = ["fish-species"];
    const targetFolder = folderInput && allowedFolders.includes(folderInput) ? folderInput : "fish-species";

    if (!file) {
      return NextResponse.json({ success: false, error: "缺少文件" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!isValidType) {
      return NextResponse.json({ success: false, error: "不支持的图片类型" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "文件大小超过限制（8MB）" }, { status: 400 });
    }

    if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "OSS 配置缺失" }, { status: 500 });
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const fileExt = ext || "jpg";
    const objectKey = `${targetFolder}/${timestamp}_${randomId}.${fileExt}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await ossClient.put(objectKey, buffer);
    const url = (result.url || "").replace("http://", "https://");

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("管理员上传图片失败:", error);
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}

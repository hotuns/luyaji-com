/**
 * 上传头像图片到阿里云 OSS
 *
 * 使用方法：
 * cd luyaji && npx ts-node scripts/upload-avatars.ts
 *
 * 或者：
 * cd luyaji && pnpm exec ts-node scripts/upload-avatars.ts
 */

// @ts-ignore
import OSS from "ali-oss";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// 加载 web 项目的环境变量
dotenv.config({ path: path.join(__dirname, "../apps/web/.env") });

const OSS_BUCKET_NAME = process.env.OSS_BUCKET_NAME || "the-weapplyj";
const OSS_ENDPOINT = process.env.OSS_ENDPOINT || "http://oss-cn-beijing.aliyuncs.com";
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || "";
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || "";

if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
  console.error("❌ 缺少 OSS 配置，请检查 .env 文件");
  process.exit(1);
}

// 从 endpoint 提取 region
const regionMatch = OSS_ENDPOINT.match(/oss-([a-z0-9-]+)\.aliyuncs\.com/);
const region = regionMatch ? `oss-${regionMatch[1]}` : "oss-cn-beijing";

console.log("🔧 OSS 配置:");
console.log(`   Region: ${region}`);
console.log(`   Bucket: ${OSS_BUCKET_NAME}`);

// 创建 OSS 客户端
const client = new OSS({
  region: region,
  accessKeyId: OSS_ACCESS_KEY_ID,
  accessKeySecret: OSS_ACCESS_KEY_SECRET,
  bucket: OSS_BUCKET_NAME,
  secure: true, // 使用 HTTPS
});

// 头像图片目录
const AVATAR_DIR = path.join(__dirname, "../luyaji-image/avatar");
const AVATAR_NAME_DIR = path.join(__dirname, "../luyaji-image/avatar_name");

// OSS 存储路径
const OSS_AVATAR_PATH = "avatars/";
const OSS_AVATAR_NAME_PATH = "avatars_name/";

interface UploadResult {
  name: string;
  localPath: string;
  ossPath: string;
  url: string;
  success: boolean;
  error?: string;
}

async function uploadFile(
  localPath: string,
  ossPath: string
): Promise<UploadResult> {
  const name = path.basename(localPath);

  try {
    const result = await client.put(ossPath, localPath);
    console.log(`✅ 上传成功: ${name} -> ${result.url}`);
    return {
      name,
      localPath,
      ossPath,
      url: result.url,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ 上传失败: ${name} - ${errorMessage}`);
    return {
      name,
      localPath,
      ossPath,
      url: "",
      success: false,
      error: errorMessage,
    };
  }
}

async function uploadDirectory(
  localDir: string,
  ossPrefix: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  if (!fs.existsSync(localDir)) {
    console.warn(`⚠️ 目录不存在: ${localDir}`);
    return results;
  }

  const files = fs.readdirSync(localDir);

  for (const file of files) {
    // 跳过隐藏文件（macOS 的 ._ 文件）
    if (file.startsWith(".")) {
      continue;
    }

    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isFile() && /\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
      const ossPath = ossPrefix + file;
      const result = await uploadFile(localPath, ossPath);
      results.push(result);
    }
  }

  return results;
}

async function main() {
  console.log("🚀 开始上传头像图片到 OSS...\n");
  console.log(`📁 OSS Bucket: ${OSS_BUCKET_NAME}`);
  console.log(`🌐 OSS Endpoint: ${OSS_ENDPOINT}\n`);

  // 上传 avatar 目录
  console.log("📤 上传 avatar 目录...");
  const avatarResults = await uploadDirectory(AVATAR_DIR, OSS_AVATAR_PATH);

  // 上传 avatar_name 目录
  console.log("\n📤 上传 avatar_name 目录...");
  const avatarNameResults = await uploadDirectory(
    AVATAR_NAME_DIR,
    OSS_AVATAR_NAME_PATH
  );

  // 生成头像配置文件
  const avatarConfig = {
    avatars: avatarResults
      .filter((r) => r.success)
      .map((r) => ({
        name: r.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, ""),
        url: r.url.replace("http://", "https://"),
        fileName: r.name,
      })),
    avatarsWithName: avatarNameResults
      .filter((r) => r.success)
      .map((r) => ({
        name: r.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, ""),
        url: r.url.replace("http://", "https://"),
        fileName: r.name,
      })),
  };

  // 保存配置文件
  const configPath = path.join(__dirname, "../apps/web/lib/avatar-config.ts");
  const configContent = `/**
 * 预设头像配置
 * 由脚本自动生成，请勿手动修改
 * 生成时间: ${new Date().toISOString()}
 */

export interface AvatarOption {
  /** 头像名称 (鱼种名) */
  name: string;
  /** 头像 URL */
  url: string;
  /** 文件名 */
  fileName: string;
}

/** 无名字的头像列表 */
export const avatars: AvatarOption[] = ${JSON.stringify(avatarConfig.avatars, null, 2)};

/** 带名字的头像列表 */
export const avatarsWithName: AvatarOption[] = ${JSON.stringify(avatarConfig.avatarsWithName, null, 2)};

/** 默认头像 */
export const defaultAvatar = avatars.find(a => a.name === "default") || avatars[0];

/** 获取头像 URL */
export function getAvatarUrl(name: string, withName = false): string | undefined {
  const list = withName ? avatarsWithName : avatars;
  return list.find(a => a.name === name)?.url;
}
`;

  fs.writeFileSync(configPath, configContent);
  console.log(`\n✅ 头像配置已保存到: ${configPath}`);

  // 复制配置到 admin
  const adminConfigPath = path.join(
    __dirname,
    "../apps/admin/lib/avatar-config.ts"
  );
  fs.writeFileSync(adminConfigPath, configContent);
  console.log(`✅ 头像配置已复制到: ${adminConfigPath}`);

  // 统计
  console.log("\n📊 上传统计:");
  console.log(
    `   avatar: ${avatarResults.filter((r) => r.success).length}/${avatarResults.length} 成功`
  );
  console.log(
    `   avatar_name: ${avatarNameResults.filter((r) => r.success).length}/${avatarNameResults.length} 成功`
  );
}

main().catch(console.error);

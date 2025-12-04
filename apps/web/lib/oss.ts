import OSS from "ali-oss";

const OSS_BUCKET_NAME = process.env.OSS_BUCKET_NAME || "the-weapplyj";
const OSS_ENDPOINT = process.env.OSS_ENDPOINT || "http://oss-cn-beijing.aliyuncs.com";
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || "";
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || "";

const regionMatch = OSS_ENDPOINT.match(/oss-([a-z0-9-]+)\.aliyuncs\.com/);
const OSS_REGION = regionMatch ? `oss-${regionMatch[1]}` : "oss-cn-beijing";

let ossClient: OSS | null = null;

function getOssClient(): OSS | null {
  if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
    return null;
  }
  if (!ossClient) {
    ossClient = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET_NAME,
      secure: true,
    });
  }
  return ossClient;
}

/**
 * 从完整 URL 中提取 OSS object key
 * 例如: https://bucket.oss-cn-beijing.aliyuncs.com/catches/xxx.jpg -> catches/xxx.jpg
 */
function extractObjectKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // 去掉开头的 /
    return urlObj.pathname.slice(1);
  } catch {
    return null;
  }
}

/**
 * 删除单个 OSS 文件
 */
export async function deleteOssFile(url: string): Promise<boolean> {
  const client = getOssClient();
  if (!client) {
    console.warn("OSS client not configured, skip deletion");
    return false;
  }

  const objectKey = extractObjectKey(url);
  if (!objectKey) {
    console.warn("Failed to extract object key from URL:", url);
    return false;
  }

  try {
    await client.delete(objectKey);
    console.log("Deleted OSS file:", objectKey);
    return true;
  } catch (error) {
    console.error("Failed to delete OSS file:", objectKey, error);
    return false;
  }
}

/**
 * 批量删除 OSS 文件
 */
export async function deleteOssFiles(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  const client = getOssClient();
  if (!client) {
    console.warn("OSS client not configured, skip deletion");
    return;
  }

  const objectKeys = urls
    .map(extractObjectKey)
    .filter((key): key is string => key !== null);

  if (objectKeys.length === 0) return;

  try {
    // 阿里云 OSS 支持批量删除，最多 1000 个
    await client.deleteMulti(objectKeys, { quiet: true });
    console.log("Deleted OSS files:", objectKeys);
  } catch (error) {
    console.error("Failed to delete OSS files:", error);
  }
}

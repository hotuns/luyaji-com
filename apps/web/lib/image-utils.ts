/**
 * 图片处理工具
 * - 统一转换为 JPEG 格式（解决 iOS HEIC 兼容性问题）
 * - 压缩图片（减少存储和加快上传速度）
 */

/**
 * 将图片转换为 JPEG 格式并压缩
 * @param file 原始文件
 * @param maxWidth 最大宽度，超过会等比缩放
 * @param quality JPEG 质量 (0-1)
 * @returns 转换后的 Blob
 */
export function convertToJpeg(
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算缩放尺寸
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // 使用 Canvas 转换格式
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("转换失败"));
          }
        },
        "image/jpeg",
        quality
      );

      // 释放 URL
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("图片加载失败"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 处理上传的图片文件
 * - 所有图片都会转换为 JPEG 格式并压缩
 * - 减少存储空间和加快上传速度
 * @param file 原始文件
 * @param options 选项
 * @returns 处理后的文件和新文件名
 */
export async function processImageForUpload(
  file: File,
  options: {
    maxWidth?: number;
    quality?: number;
  } = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    maxWidth = 1920,
    quality = 0.82, // 稍微降低质量以获得更好的压缩率
  } = options;

  const originalSize = file.size;
  
  // 统一转换为 JPEG 并压缩
  const blob = await convertToJpeg(file, maxWidth, quality);
  const filename = file.name.replace(/\.[^.]+$/, ".jpg");
  
  const compressedSize = blob.size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  
  console.log(
    `图片处理: ${file.name} (${file.type})`,
    `${(originalSize / 1024).toFixed(0)}KB -> ${(compressedSize / 1024).toFixed(0)}KB`,
    `(压缩 ${ratio}%)`
  );

  return { blob, filename };
}

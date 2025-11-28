/**
 * 预设头像配置
 * 由脚本自动生成，请勿手动修改
 * 生成时间: 2025-11-28T03:44:48.080Z
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
export const avatars: AvatarOption[] = [
  {
    "name": "default",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/default.png",
    "fileName": "default.png"
  },
  {
    "name": "狗",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E7%8B%97.png",
    "fileName": "狗.png"
  },
  {
    "name": "鱤",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B1%A4.png",
    "fileName": "鱤.png"
  },
  {
    "name": "鱲",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B1%B2.png",
    "fileName": "鱲.png"
  },
  {
    "name": "鲃",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B2%83.png",
    "fileName": "鲃.png"
  },
  {
    "name": "鲈",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B2%88.png",
    "fileName": "鲈.png"
  },
  {
    "name": "鲌",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B2%8C.png",
    "fileName": "鲌.png"
  },
  {
    "name": "鳜",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B3%9C.png",
    "fileName": "鳜.png"
  },
  {
    "name": "鳟",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B3%9F.png",
    "fileName": "鳟.png"
  },
  {
    "name": "鳢",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars/%E9%B3%A2.png",
    "fileName": "鳢.png"
  }
];

/** 带名字的头像列表 */
export const avatarsWithName: AvatarOption[] = [
  {
    "name": "狗",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E7%8B%97.png",
    "fileName": "狗.png"
  },
  {
    "name": "鱤",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B1%A4.png",
    "fileName": "鱤.png"
  },
  {
    "name": "鱲",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B1%B2.png",
    "fileName": "鱲.png"
  },
  {
    "name": "鲃",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B2%83.png",
    "fileName": "鲃.png"
  },
  {
    "name": "鲈",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B2%88.png",
    "fileName": "鲈.png"
  },
  {
    "name": "鲌",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B2%8C.png",
    "fileName": "鲌.png"
  },
  {
    "name": "鳜",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B3%9C.png",
    "fileName": "鳜.png"
  },
  {
    "name": "鳟",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B3%9F.png",
    "fileName": "鳟.png"
  },
  {
    "name": "鳢",
    "url": "https://the-weapplyj.oss-cn-beijing.aliyuncs.com/avatars_name/%E9%B3%A2.png",
    "fileName": "鳢.png"
  }
];

/** 默认头像 */
export const defaultAvatar = avatars.find(a => a.name === "default") || avatars[0];

/** 获取头像 URL */
export function getAvatarUrl(name: string, withName = false): string | undefined {
  const list = withName ? avatarsWithName : avatars;
  return list.find(a => a.name === name)?.url;
}

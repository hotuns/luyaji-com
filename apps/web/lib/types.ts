// 路亚记 - TypeScript 类型定义

// ==================== 装备相关 ====================

export interface ComboLure {
  id: string;
  name: string;
  type?: string; // 米诺、亮片、软饵、水面系等
  note?: string;
}

export interface Rod {
  id: string;
  userId: string;
  name: string;
  brand?: string | null;
  length?: number | null;
  lengthUnit?: string | null;
  power?: string | null;
  lureWeightMin?: number | null;
  lureWeightMax?: number | null;
  lineWeightText?: string | null;
  note?: string | null;
  visibility: "private" | "public";
  sourceType: "user" | "template" | "copied";
  createdAt: Date;
  updatedAt: Date;
}

export interface Reel {
  id: string;
  userId: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  gearRatioText?: string | null;
  lineCapacityText?: string | null;
  note?: string | null;
  visibility: "private" | "public";
  sourceType: "user" | "template" | "copied";
  createdAt: Date;
  updatedAt: Date;
}

export interface Combo {
  id: string;
  userId: string;
  name: string;
  rodId: string;
  reelId: string;
  mainLineText?: string | null;
  leaderLineText?: string | null;
  hookText?: string | null;
  lures?: ComboLure[] | null;
  sceneTags?: string[] | null;
  detailNote?: string | null;
  visibility: "private" | "public";
  sourceType: "user" | "template" | "copied";
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  rod?: Rod;
  reel?: Reel;
}

// ==================== 出击记录相关 ====================

export interface Trip {
  id: string;
  userId: string;
  title?: string | null;
  startTime: Date;
  endTime?: Date | null;
  locationName: string;
  locationLat?: number | null;
  locationLng?: number | null;
  note?: string | null;
  weatherType?: string | null;
  weatherTemperatureText?: string | null;
  weatherWindText?: string | null;
  totalCatchCount?: number | null;
  fishSpeciesCount?: number | null;
  visibility: "private" | "public";
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  tripCombos?: TripCombo[];
  catches?: Catch[];
}

export interface TripCombo {
  id: string;
  tripId: string;
  comboId: string;
  note?: string | null;
  combo?: Combo;
}

// ==================== 渔获与鱼种相关 ====================

export interface FishSpecies {
  id: string;
  name: string;
  latinName?: string | null;
  aliasNames?: string[] | null;
  habitatType?: "fresh" | "salt" | "brackish" | string | null;
  imageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface Catch {
  id: string;
  tripId: string;
  userId: string;
  speciesId: string;
  speciesName: string;
  count: number;
  sizeText?: string | null;
  weightText?: string | null;
  caughtAt?: Date | null;
  comboId?: string | null;
  lureText?: string | null;
  note?: string | null;
  photoUrls?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  species?: FishSpecies;
  combo?: Combo;
}

// ==================== 表单相关 ====================

// 新建出击表单状态（用于三步向导）
export interface TripFormState {
  // Step1: 基础信息
  title?: string;
  startTime: string; // ISO string
  locationName: string;
  note?: string;

  // Step2: 装备组合 & 天气
  usedComboIds: string[];
  weatherType?: string;
  weatherTemperatureText?: string;
  weatherWindText?: string;

  // Step3: 渔获记录
  catches: TripCatchDraft[];

  // 元数据
  currentStep: 1 | 2 | 3;
  isDraft: boolean;
  draftId?: string;
  lastSavedAt?: string;
}

// 渔获草稿
export interface TripCatchDraft {
  id: string; // 客户端临时 ID
  speciesId: string;
  speciesName: string;
  count: number;
  sizeText?: string;
  comboId?: string;
  lureText?: string;
  note?: string;
}

// 天气类型选项
export const WEATHER_TYPES = [
  "晴",
  "多云",
  "阴",
  "小雨",
  "中雨",
  "大雨",
  "雾/霾",
] as const;

export type WeatherType = (typeof WEATHER_TYPES)[number];

// 鱼竿调性选项
export const ROD_POWERS = ["UL", "L", "ML", "M", "MH", "H", "XH"] as const;

export type RodPower = (typeof ROD_POWERS)[number];

// ==================== API 请求/响应类型 ====================

export interface CreateTripRequest {
  title?: string;
  startTime: string;
  locationName: string;
  note?: string;
  usedComboIds: string[];
  weather?: {
    type?: string;
    temperatureText?: string;
    windText?: string;
  };
  catches?: Array<{
    speciesId: string;
    count: number;
    sizeText?: string;
    comboId?: string;
    lureText?: string;
    note?: string;
  }>;
}

export interface CreateRodRequest {
  name: string;
  brand?: string;
  length?: number;
  lengthUnit?: string;
  power?: string;
  lureWeightMin?: number;
  lureWeightMax?: number;
  lineWeightText?: string;
  note?: string;
  visibility?: "private" | "public";
}

export interface CreateReelRequest {
  name: string;
  brand?: string;
  model?: string;
  gearRatioText?: string;
  lineCapacityText?: string;
  note?: string;
  visibility?: "private" | "public";
}

export interface CreateComboRequest {
  name: string;
  rodId: string;
  reelId: string;
  mainLineText?: string;
  leaderLineText?: string;
  hookText?: string;
  lures?: ComboLure[];
  sceneTags?: string[];
  detailNote?: string;
  visibility?: "private" | "public";
}

// API 响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 中国常见淡水鱼种
const freshwaterFish = [
  { name: "翘嘴", latinName: "Culter alburnus", habitatType: "fresh" },
  { name: "鲈鱼", latinName: "Lateolabrax japonicus", habitatType: "fresh" },
  { name: "黑鱼", latinName: "Channa argus", habitatType: "fresh" },
  { name: "鳜鱼", latinName: "Siniperca chuatsi", habitatType: "fresh" },
  { name: "鲫鱼", latinName: "Carassius auratus", habitatType: "fresh" },
  { name: "鲤鱼", latinName: "Cyprinus carpio", habitatType: "fresh" },
  { name: "草鱼", latinName: "Ctenopharyngodon idella", habitatType: "fresh" },
  { name: "青鱼", latinName: "Mylopharyngodon piceus", habitatType: "fresh" },
  { name: "鲢鱼", latinName: "Hypophthalmichthys molitrix", habitatType: "fresh" },
  { name: "鳙鱼", latinName: "Hypophthalmichthys nobilis", habitatType: "fresh" },
  { name: "罗非鱼", latinName: "Oreochromis niloticus", habitatType: "fresh" },
  { name: "马口", latinName: "Opsariichthys bidens", habitatType: "fresh" },
  { name: "白条", latinName: "Hemiculter leucisculus", habitatType: "fresh" },
  { name: "鳊鱼", latinName: "Parabramis pekinensis", habitatType: "fresh" },
  { name: "红尾", latinName: "Erythroculter ilishaeformis", habitatType: "fresh" },
  { name: "鲶鱼", latinName: "Silurus asotus", habitatType: "fresh" },
  { name: "黄颡鱼", latinName: "Pelteobagrus fulvidraco", habitatType: "fresh" },
  { name: "鳗鱼", latinName: "Anguilla japonica", habitatType: "fresh" },
  { name: "甲鱼", latinName: "Pelodiscus sinensis", habitatType: "fresh" },
  { name: "虹鳟", latinName: "Oncorhynchus mykiss", habitatType: "fresh" },
];

// 海水/咸水鱼种
const saltwaterFish = [
  { name: "海鲈鱼", latinName: "Lateolabrax japonicus", habitatType: "salt" },
  { name: "鲅鱼", latinName: "Scomberomorus niphonius", habitatType: "salt" },
  { name: "黄鱼", latinName: "Larimichthys crocea", habitatType: "salt" },
  { name: "带鱼", latinName: "Trichiurus lepturus", habitatType: "salt" },
  { name: "石斑鱼", latinName: "Epinephelus", habitatType: "salt" },
  { name: "真鲷", latinName: "Pagrus major", habitatType: "salt" },
  { name: "黑鲷", latinName: "Acanthopagrus schlegelii", habitatType: "salt" },
  { name: "军曹鱼", latinName: "Rachycentron canadum", habitatType: "salt" },
  { name: "GT", latinName: "Caranx ignobilis", habitatType: "salt" },
  { name: "金枪鱼", latinName: "Thunnus", habitatType: "salt" },
];

const rodTemplates = [
  {
    id: "ROD_TEMPLATE_STREAM_LIGHT",
    name: "溪流微物直柄",
    brand: "Shimano",
    length: 1.98,
    lengthUnit: "m",
    power: "UL",
    lureWeightMin: 1,
    lureWeightMax: 7,
    lineWeightText: "PE0.4-0.8",
    note: "适合溪流、微物钓法，搭配0.6-0.8号主线。",
  },
  {
    id: "ROD_TEMPLATE_BASS_ALLROUND",
    name: "黑鲈通用抛投竿",
    brand: "Megabass",
    length: 2.08,
    lengthUnit: "m",
    power: "M",
    lureWeightMin: 5,
    lureWeightMax: 21,
    lineWeightText: "8-16lb",
    note: "覆盖常见硬饵、软饵的抛投需求。",
  },
  {
    id: "ROD_TEMPLATE_SHORE_JIGGING",
    name: "岸抛铁板竿",
    brand: "Daiwa",
    length: 2.9,
    lengthUnit: "m",
    power: "MH",
    lureWeightMin: 20,
    lureWeightMax: 80,
    lineWeightText: "PE1.2-2.0",
    note: "岸抛铁板/亮片，兼顾远投与控饵。",
  },
];

const reelTemplates = [
  {
    id: "REEL_TEMPLATE_2500_FINE",
    name: "2500 微物纺车轮",
    brand: "Shimano",
    model: "Vanford 2500SHG",
    gearRatioText: "6.0:1",
    lineCapacityText: "PE 0.8号 / 150m",
    note: "轻量微物配置，搭配UL~L竿。",
  },
  {
    id: "REEL_TEMPLATE_3000_ALLROUND",
    name: "3000 通用纺车轮",
    brand: "Daiwa",
    model: "Certate LT3000",
    gearRatioText: "5.2:1",
    lineCapacityText: "PE 1.2号 / 200m",
    note: "黑鲈、海鲈通用快速收线。",
  },
  {
    id: "REEL_TEMPLATE_BAITCAST",
    name: "低切换路亚鼓轮",
    brand: "Abu Garcia",
    model: "Revo Beast",
    gearRatioText: "7.3:1",
    lineCapacityText: "PE 2号 / 120m",
    note: "适合大饵、大物和重障碍覆盖。",
  },
];

async function main() {
  // 只同步元数据（品牌等枚举）
  console.log("同步系统元数据...");
  await seedMetadata();
  console.log("元数据同步完成！");
}

type MetadataSeedBase = {
  value: string;
  label: string;
  sortOrder: number;
  aliases?: string[];
};

const withCategory = (category: string, items: MetadataSeedBase[]) =>
  items.map((item) => ({ category, ...item }));

// 元数据种子数据
const metadataItems = [
  ...withCategory("rod_brand", [
    { value: "shimano", label: "禧玛诺 Shimano", sortOrder: 1, aliases: ["shimano", "禧玛诺", "shiman0", "shiman"] },
    { value: "daiwa", label: "达亿瓦 Daiwa", sortOrder: 2, aliases: ["daiwa", "达亿瓦", "达瓦", "steez"] },
    { value: "megabass", label: "Megabass", sortOrder: 3, aliases: ["megabass"] },
    { value: "evergreen", label: "常绿 Evergreen", sortOrder: 4, aliases: ["evergreen", "常绿"] },
    { value: "jackall", label: "Jackall", sortOrder: 5, aliases: ["jackall"] },
    { value: "deps", label: "Deps", sortOrder: 6 },
    { value: "tailwalk", label: "Tailwalk", sortOrder: 7 },
    { value: "yamaga", label: "Yamaga Blanks", sortOrder: 8 },
    { value: "tenryu", label: "天龙 Tenryu", sortOrder: 9, aliases: ["tenryu", "天龙"] },
    { value: "majorcraft", label: "Major Craft", sortOrder: 10, aliases: ["major craft", "majorcraft"] },
    { value: "abugarcia", label: "阿布 Abu Garcia", sortOrder: 11, aliases: ["abu", "abugarcia", "阿布"] },
    { value: "rapala", label: "Rapala", sortOrder: 12 },
    { value: "favorite", label: "Favorite", sortOrder: 13 },
    { value: "kawa", label: "科瓦 Kawa", sortOrder: 14, aliases: ["kawa", "科瓦"] },
    { value: "lurekiller", label: "Lurekiller", sortOrder: 15 },
    { value: "ark", label: "ARK", sortOrder: 16, aliases: ["ark", "ARK"] },
    { value: "lingfeng", label: "领峰 Lingfeng", sortOrder: 17, aliases: ["领峰", "lingfeng"] },
    { value: "fudianya", label: "负电压", sortOrder: 18, aliases: ["负电压"] },
    { value: "heidao", label: "黑刀", sortOrder: 19, aliases: ["黑刀"] },
    { value: "liuyu", label: "六鱼", sortOrder: 20, aliases: ["六鱼"] },
    { value: "diaozhiwu", label: "钓之屋", sortOrder: 21, aliases: ["钓之屋"] },
    { value: "samba", label: "桑巴", sortOrder: 22, aliases: ["桑巴", "samba"] },
    { value: "haodun", label: "浩顿", sortOrder: 23, aliases: ["浩顿"] },
    { value: "longyan", label: "龙焰", sortOrder: 24, aliases: ["龙焰"] },
    { value: "qizhigan", label: "七支竿", sortOrder: 25, aliases: ["七支竿"] },
    { value: "dayuxiansheng", label: "大鱼先生", sortOrder: 26, aliases: ["大鱼先生"] },
    { value: "guangwei", label: "光威", sortOrder: 27, aliases: ["光威"] },
    { value: "yikuoda", label: "原型伊酷达", sortOrder: 28, aliases: ["原型伊酷达"] },
    { value: "dijia", label: "迪佳", sortOrder: 29, aliases: ["迪佳"] },
    { value: "wanlushi", label: "万路仕", sortOrder: 30, aliases: ["万路仕"] },
    { value: "xiaomifeng", label: "小蜜蜂", sortOrder: 31, aliases: ["小蜜蜂"] },
    { value: "runke", label: "润克", sortOrder: 32, aliases: ["润克"] },
    { value: "weiluke", label: "威路克", sortOrder: 33, aliases: ["威路克"] },
    { value: "niandiao", label: "念钓", sortOrder: 34, aliases: ["念钓"] },
    { value: "jiyu-brand", label: "吉渔", sortOrder: 35, aliases: ["吉渔"] },
    { value: "olympic", label: "奥林匹克 Olympic", sortOrder: 36, aliases: ["奥林匹克", "olympic"] },
    { value: "xinyueyan", label: "新月岩", sortOrder: 37, aliases: ["新月岩"] },
    { value: "linque", label: "凛雀", sortOrder: 38, aliases: ["凛雀"] },
    { value: "weigeer", label: "威格尔", sortOrder: 39, aliases: ["威格尔"] },
    { value: "jiyu-fish", label: "吉鱼", sortOrder: 40, aliases: ["吉鱼"] },
    { value: "yayu", label: "鸦语", sortOrder: 41, aliases: ["鸦语"] },
    { value: "stcroix", label: "圣克鲁伊 St. Croix", sortOrder: 42, aliases: ["圣克鲁伊", "stcroix", "saintcroix"] },
    { value: "xiyingfeng", label: "细硬锋", sortOrder: 43, aliases: ["细硬锋"] },
    { value: "gloomis", label: "G. Loomis", sortOrder: 44, aliases: ["gloomis", "g.loomis"] },
    { value: "other", label: "其他品牌", sortOrder: 99, aliases: ["其他", "other"] },
  ]),
  ...withCategory("reel_brand", [
    { value: "shimano", label: "禧玛诺 Shimano", sortOrder: 1, aliases: ["shimano", "禧玛诺", "shiman"] },
    { value: "daiwa", label: "达亿瓦 Daiwa", sortOrder: 2, aliases: ["daiwa", "达亿瓦", "达瓦"] },
    { value: "abugarcia", label: "阿布 Abu Garcia", sortOrder: 3, aliases: ["abu", "阿布"] },
    { value: "penn", label: "Penn", sortOrder: 4 },
    { value: "okuma", label: "宝熊 Okuma", sortOrder: 5, aliases: ["okuma", "宝熊"] },
    { value: "ryobi", label: "利优比 Ryobi", sortOrder: 6, aliases: ["ryobi", "利优比"] },
    { value: "tailwalk", label: "Tailwalk", sortOrder: 7 },
    { value: "gomexus", label: "Gomexus", sortOrder: 8 },
    { value: "kastking", label: "KastKing", sortOrder: 9, aliases: ["kastking", "卡斯丁"] },
    { value: "piscifun", label: "Piscifun", sortOrder: 10 },
    { value: "haibo", label: "海伯 Haibo", sortOrder: 11, aliases: ["海伯", "haibo"] },
    { value: "mitchell", label: "米歇尔 Mitchell", sortOrder: 12, aliases: ["米歇尔", "mitchell"] },
    { value: "yichao", label: "益超", sortOrder: 13, aliases: ["益超"] },
    { value: "takuma", label: "塔库马 Takuma", sortOrder: 14, aliases: ["塔库马", "takuma"] },
    { value: "guangwei-reel", label: "光威", sortOrder: 15, aliases: ["光威"] },
    { value: "other", label: "其他品牌", sortOrder: 99, aliases: ["其他", "other"] },
  ]),
  ...withCategory("combo_scene_tag", [
    { value: "stream", label: "溪流", sortOrder: 1, aliases: ["溪流", "stream", "溪流微物"] },
    { value: "lake", label: "湖库", sortOrder: 2, aliases: ["lake", "湖", "湖库", "水库", "库区", "湖库滑漂"] },
    { value: "river", label: "江河", sortOrder: 3, aliases: ["river", "江河", "河流", "野河", "大江大河大湖", "城市河道"] },
    { value: "pond", label: "池塘/黑坑", sortOrder: 4, aliases: ["池塘", "黑坑", "黑坑正钓"] },
    { value: "shore", label: "岸钓", sortOrder: 5, aliases: ["岸钓", "shore", "海边", "岸投轻型铁板", "海岸远投微型铁板"] },
    { value: "boat", label: "船钓", sortOrder: 6, aliases: ["船钓", "boat", "筏钓"] },
    { value: "kayak", label: "皮划艇", sortOrder: 7 },
    { value: "saltwater", label: "海钓", sortOrder: 8, aliases: ["saltwater", "海钓"] },
    { value: "night", label: "夜钓", sortOrder: 9 },
    { value: "micro-game", label: "微物", sortOrder: 20, aliases: ["微物", "微物通杀"] },
    { value: "bass-killer", label: "鲈鱼杀手", sortOrder: 21, aliases: ["鲈鱼杀手"] },
    { value: "workout", label: "锻炼身体", sortOrder: 22, aliases: ["锻炼身体"] },
    { value: "search-edge", label: "搜边离底飘", sortOrder: 23, aliases: ["搜边离底飘"] },
    { value: "clear-water", label: "亮水", sortOrder: 24, aliases: ["亮水"] },
    { value: "grind", label: "没鱼硬磨", sortOrder: 25, aliases: ["没鱼硬磨！"] },
    { value: "swimbait-black", label: "泳饵+打黑", sortOrder: 26, aliases: ["泳饵+打黑"] },
    { value: "fast-grab", label: "抢鱼", sortOrder: 27, aliases: ["抢鱼", "开场一波抢鱼结束都可以使用"] },
    { value: "poison-zone", label: "毒区作战", sortOrder: 28, aliases: ["毒区作战专用"] },
    { value: "throw-away", label: "扔河里不心疼", sortOrder: 29, aliases: ["扔河里不心疼"] },
    { value: "beatup", label: "破烂快断了吧", sortOrder: 30, aliases: ["破烂快断了吧"] },
    { value: "business-trip", label: "出差旅游", sortOrder: 31, aliases: ["出差旅游"] },
    { value: "micro-lead-bass", label: "微铅匀收鳜鱼", sortOrder: 33, aliases: ["微铅匀收鳜鱼"] },
    { value: "vertical-bass", label: "倒钓鲈鱼", sortOrder: 34, aliases: ["倒钓鲈鱼"] },
    { value: "spinnerbaits", label: "复合亮片匀收鲈鱼", sortOrder: 35, aliases: ["复合亮片匀收鲈鱼"] },
    { value: "lading", label: "辣丁路滑", sortOrder: 36, aliases: ["辣丁路滑"] },
  ]),
  ...withCategory("rod_power", [
    { value: "UL", label: "UL (超软)", sortOrder: 1 },
    { value: "L", label: "L (软)", sortOrder: 2 },
    { value: "ML", label: "ML (中软)", sortOrder: 3 },
    { value: "M", label: "M (中)", sortOrder: 4 },
    { value: "MH", label: "MH (中硬)", sortOrder: 5 },
    { value: "H", label: "H (硬)", sortOrder: 6 },
    { value: "XH", label: "XH (超硬)", sortOrder: 7 },
    { value: "UL+", label: "UL+ (加硬)", sortOrder: 8, aliases: ["ul+", "ulplus"] },
    { value: "UL-ML", label: "UL-ML", sortOrder: 9, aliases: ["ul-ml"] },
    { value: "CLASS3", label: "Class 3", sortOrder: 10, aliases: ["class3", "class 3"] },
    { value: "POWER37", label: "37 调", sortOrder: 11, aliases: ["37"] },
    { value: "L+", label: "L+", sortOrder: 12, aliases: ["l+", "L+"] },
    { value: "SUPERHARD", label: "超硬", sortOrder: 13, aliases: ["超硬"] },
    { value: "POWER28", label: "28 调", sortOrder: 14, aliases: ["28"] },
    { value: "L-M", label: "L-M", sortOrder: 15, aliases: ["l-m"] },
    { value: "ML+", label: "ML+", sortOrder: 16, aliases: ["ml+", "ML+"] },
    { value: "T81HC", label: "T-81.HC", sortOrder: 17, aliases: ["t-81.hc", "t81hc"] },
    { value: "M-MH", label: "M/MH", sortOrder: 18, aliases: ["m/mh"] },
    { value: "CARP", label: "鲤竿", sortOrder: 19, aliases: ["鲤"] },
    { value: "UL-M", label: "UL/M", sortOrder: 20, aliases: ["ul/m"] },
    { value: "L-ML", label: "L-ML", sortOrder: 21, aliases: ["l-ml"] },
  ]),
  ...withCategory("length_unit", [
    { value: "m", label: "米 (m)", sortOrder: 1, aliases: ["m", "meter", "米"] },
    { value: "ft", label: "英尺 (ft)", sortOrder: 2, aliases: ["ft", "feet", "英尺"] },
  ]),
  ...withCategory("weather_type", [
    { value: "sunny", label: "晴天", sortOrder: 1, aliases: ["sunny", "晴"] },
    { value: "cloudy", label: "多云", sortOrder: 2, aliases: ["cloudy", "多云"] },
    { value: "overcast", label: "阴天", sortOrder: 3, aliases: ["overcast", "阴"] },
    { value: "rain", label: "小雨", sortOrder: 4, aliases: ["rain", "雨", "小雨"] },
    { value: "storm", label: "暴雨/雷暴", sortOrder: 5, aliases: ["storm", "暴雨", "雷阵雨", "大雨"] },
    { value: "fog", label: "雾天", sortOrder: 6, aliases: ["fog", "雾"] },
    { value: "windy", label: "大风", sortOrder: 7, aliases: ["wind", "windy", "大风"] },
    { value: "snow", label: "降雪", sortOrder: 8, aliases: ["snow", "雪"] },
  ]),
];

async function seedMetadata() {
  for (const item of metadataItems) {
    await prisma.metadata.upsert({
      where: {
        category_value: {
          category: item.category,
          value: item.value,
        },
      },
      update: {
        label: item.label,
        sortOrder: item.sortOrder,
        aliases: item.aliases,
      },
      create: item,
    });
    console.log(`  ✓ [${item.category}] ${item.label}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

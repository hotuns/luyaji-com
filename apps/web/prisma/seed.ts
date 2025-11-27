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

async function main() {
  console.log("开始初始化鱼种数据...");

  // 创建默认管理员账号（如果不存在）
  const adminPhone = "19900000000";
  const adminNickname = "admin";
   const adminPassword = "Admin@123";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      isAdmin: true,
      nickname: adminNickname,
      passwordHash: adminPasswordHash,
    },
    create: {
      phone: adminPhone,
      nickname: adminNickname,
      isAdmin: true,
      passwordHash: adminPasswordHash,
    },
  });

  console.log(`管理员账号已就绪，手机号: ${adminUser.phone}，密码: ${adminPassword}`);

  // 创建特殊的"其他"鱼种
  await prisma.fishSpecies.upsert({
    where: { id: "OTHER" },
    update: {},
    create: {
      id: "OTHER",
      name: "其他/未识别",
      habitatType: "fresh",
      description: "未能识别的鱼种",
    },
  });

  // 创建淡水鱼种
  for (const fish of freshwaterFish) {
    await prisma.fishSpecies.upsert({
      where: { name: fish.name },
      update: {
        name: fish.name,
        latinName: fish.latinName,
        habitatType: fish.habitatType,
      },
      create: {
        name: fish.name,
        latinName: fish.latinName,
        habitatType: fish.habitatType,
      },
    });
    console.log(`✓ ${fish.name}`);
  }

  // 创建海水鱼种
  for (const fish of saltwaterFish) {
    await prisma.fishSpecies.upsert({
      where: { name: fish.name },
      update: {
        name: fish.name,
        latinName: fish.latinName,
        habitatType: fish.habitatType,
      },
      create: {
        name: fish.name,
        latinName: fish.latinName,
        habitatType: fish.habitatType,
      },
    });
    console.log(`✓ ${fish.name}`);
  }

  console.log("\n鱼种数据初始化完成！");
  console.log(`共创建 ${freshwaterFish.length + saltwaterFish.length + 1} 个鱼种`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

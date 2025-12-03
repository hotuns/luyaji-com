-- AlterTable
ALTER TABLE `combos` ADD COLUMN `likeCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `combo_likes` (
    `id` VARCHAR(191) NOT NULL,
    `comboId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `combo_likes_userId_idx`(`userId`),
    UNIQUE INDEX `combo_likes_comboId_userId_key`(`comboId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `combo_likes` ADD CONSTRAINT `combo_likes_comboId_fkey` FOREIGN KEY (`comboId`) REFERENCES `combos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `combo_likes` ADD CONSTRAINT `combo_likes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

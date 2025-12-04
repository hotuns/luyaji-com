-- CreateTable
CREATE TABLE `page_views` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `referer` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `page_views_path_createdAt_idx`(`path`, `createdAt`),
    INDEX `page_views_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `page_views_visitorId_createdAt_idx`(`visitorId`, `createdAt`),
    INDEX `page_views_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activities` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `actions` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_activities_date_idx`(`date`),
    UNIQUE INDEX `user_activities_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_stats` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `pv` INTEGER NOT NULL DEFAULT 0,
    `uv` INTEGER NOT NULL DEFAULT 0,
    `newUsers` INTEGER NOT NULL DEFAULT 0,
    `activeUsers` INTEGER NOT NULL DEFAULT 0,
    `newTrips` INTEGER NOT NULL DEFAULT 0,
    `newCatches` INTEGER NOT NULL DEFAULT 0,
    `newCombos` INTEGER NOT NULL DEFAULT 0,
    `avgSessionTime` INTEGER NULL,
    `bounceRate` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `daily_stats_date_key`(`date`),
    INDEX `daily_stats_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

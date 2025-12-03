-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `endsAt` DATETIME(3) NULL,
    ADD COLUMN `showAsBanner` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `startsAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `announcements_showAsBanner_isActive_idx` ON `announcements`(`showAsBanner`, `isActive`);

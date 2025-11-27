/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `fish_species` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `fish_species_name_idx` ON `fish_species`;

-- CreateIndex
CREATE UNIQUE INDEX `fish_species_name_key` ON `fish_species`(`name`);

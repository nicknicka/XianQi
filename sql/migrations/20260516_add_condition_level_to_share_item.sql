-- share_item 增加成色列，与 sql/schema.sql 基线一致（有符号 TINYINT）。
ALTER TABLE `share_item`
ADD COLUMN `condition_level` TINYINT NULL COMMENT '成色' AFTER `daily_rent`;

ALTER TABLE `share_item`
ADD COLUMN `condition_level` tinyint unsigned DEFAULT NULL COMMENT '成色：1-10，10为全新'
AFTER `daily_rent`;

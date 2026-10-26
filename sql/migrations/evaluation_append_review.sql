ALTER TABLE `evaluation`
  ADD COLUMN `append_content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '追评内容' AFTER `images`,
  ADD COLUMN `append_images` json DEFAULT NULL COMMENT '追评图片，JSON数组' AFTER `append_content`,
  ADD COLUMN `append_time` datetime DEFAULT NULL COMMENT '追评时间' AFTER `append_images`;

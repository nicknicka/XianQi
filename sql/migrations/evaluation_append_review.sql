-- evaluation 增加追评列，与 sql/schema.sql 基线一致（append_content 为 TEXT）。
ALTER TABLE `evaluation`
  ADD COLUMN `append_content` TEXT NULL COMMENT '追评内容' AFTER `images`,
  ADD COLUMN `append_images` JSON NULL COMMENT '追评图片，JSON数组' AFTER `append_content`,
  ADD COLUMN `append_time` DATETIME NULL COMMENT '追评时间' AFTER `append_images`;

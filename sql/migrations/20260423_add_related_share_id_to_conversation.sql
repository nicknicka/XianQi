-- conversation 增加关联共享物品列，与 sql/schema.sql 基线一致（有符号 BIGINT、索引名 idx_share_id）。
ALTER TABLE `conversation`
  ADD COLUMN `related_share_id` BIGINT NULL COMMENT '关联共享物品ID' AFTER `related_product_id`,
  ADD KEY `idx_share_id` (`related_share_id`),
  ADD CONSTRAINT `fk_conversation_share` FOREIGN KEY (`related_share_id`) REFERENCES `share_item` (`share_id`) ON DELETE SET NULL;

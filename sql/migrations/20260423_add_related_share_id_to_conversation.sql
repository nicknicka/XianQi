ALTER TABLE `conversation`
  ADD COLUMN `related_share_id` bigint unsigned DEFAULT NULL COMMENT '关联共享物品ID' AFTER `related_product_id`,
  ADD KEY `idx_related_share_id` (`related_share_id`),
  ADD CONSTRAINT `fk_conversation_share` FOREIGN KEY (`related_share_id`) REFERENCES `share_item` (`share_id`) ON DELETE SET NULL;

-- AI 聊天历史表：补齐代码中已存在但 schema 缺失的表。
-- 结构与 sql/schema.sql 的 ai_chat_history 定义保持一致（主键 chat_id、created_at/updated_at）。
CREATE TABLE IF NOT EXISTS `ai_chat_history` (
  `chat_id` BIGINT NOT NULL COMMENT 'AI聊天记录ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `user_message` TEXT NULL COMMENT '用户消息',
  `ai_response` TEXT NULL COMMENT 'AI回复',
  `intent_type` VARCHAR(32) NULL COMMENT '意图类型',
  `agent_type` VARCHAR(64) NULL COMMENT 'Agent类型',
  `session_id` VARCHAR(64) NULL COMMENT '会话ID',
  `model_name` VARCHAR(64) NULL COMMENT '模型名称',
  `tokens_used` INT NULL COMMENT 'Token用量',
  `response_time_ms` INT NULL COMMENT '响应耗时',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`chat_id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_session_id` (`session_id`), KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天历史表';

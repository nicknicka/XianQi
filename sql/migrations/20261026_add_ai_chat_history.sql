-- AI 聊天历史表：补齐代码中已存在但 schema 缺失的表
CREATE TABLE IF NOT EXISTS `ai_chat_history` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `user_message` text COMMENT '用户消息',
  `ai_response` text COMMENT 'AI回复',
  `intent_type` varchar(32) DEFAULT NULL COMMENT '意图类型',
  `agent_type` varchar(64) DEFAULT NULL COMMENT 'Agent类型',
  `session_id` varchar(64) DEFAULT NULL COMMENT '会话ID',
  `model_name` varchar(64) DEFAULT NULL COMMENT '使用的模型名称',
  `tokens_used` int DEFAULT NULL COMMENT '消耗的token数量',
  `response_time_ms` int DEFAULT NULL COMMENT '响应时间（毫秒）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI聊天历史表';

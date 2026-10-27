-- 订单操作日志表：把用户侧订单操作从 operation_log（管理员审计）中分离出来。
-- 背景见 issue #46 与 ADR-0010。
CREATE TABLE IF NOT EXISTS `order_log` (
  `order_log_id` BIGINT NOT NULL COMMENT '订单日志ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `operator_id` BIGINT NULL COMMENT '操作人用户ID',
  `operator_name` VARCHAR(50) NULL COMMENT '操作人昵称（冗余，便于展示）',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型：create/confirm/cancel/complete/refund_request/refund_approve/refund_reject',
  `detail` VARCHAR(500) NULL COMMENT '操作描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`order_log_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_operator_id` (`operator_id`),
  CONSTRAINT `fk_order_log_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  CONSTRAINT `fk_order_log_operator` FOREIGN KEY (`operator_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单操作日志表';

-- 迁移已存在于 operation_log 的订单日志（biz_type='order'）。
-- 历史行的操作人只以 username 字符串保存，operator_id 无法还原，故留空。
-- 旧表 action 存的是中文（如“创建订单”）；order_log 统一存英文 code，
-- 展示时由后端翻译，这里做一次中文 -> code 的映射。
INSERT INTO `order_log` (`order_log_id`, `order_id`, `operator_id`, `operator_name`, `action`, `detail`, `created_at`)
SELECT
  `log_id`,
  `biz_id`,
  NULL,
  `username`,
  CASE `action`
    WHEN '创建订单' THEN 'create'
    WHEN '确认订单' THEN 'confirm'
    WHEN '取消订单' THEN 'cancel'
    WHEN '完成订单' THEN 'complete'
    WHEN '申请退款' THEN 'refund_request'
    WHEN '同意退款' THEN 'refund_approve'
    WHEN '拒绝退款' THEN 'refund_reject'
    ELSE COALESCE(`action`, 'unknown')
  END,
  `description`,
  `created_at`
FROM `operation_log`
WHERE `biz_type` = 'order'
  AND `biz_id` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `order_log` ol WHERE ol.`order_log_id` = `operation_log`.`log_id`
  );

-- share_item_booking 支付列，与 sql/schema.sql 基线一致：
-- payment_status 非空默认 0；payment_order_no 长度 VARCHAR(50)。
ALTER TABLE share_item_booking
ADD COLUMN pay_time DATETIME NULL COMMENT '总支付时间',
ADD COLUMN payment_status TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0待支付，1已支付，2已退款',
ADD COLUMN payment_order_no VARCHAR(50) NULL COMMENT '支付订单号',
ADD COLUMN payment_amount DECIMAL(10,2) NULL COMMENT '实际支付金额';

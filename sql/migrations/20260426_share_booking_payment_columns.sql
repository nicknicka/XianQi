ALTER TABLE share_item_booking
ADD COLUMN pay_time DATETIME NULL COMMENT '总支付时间',
ADD COLUMN payment_status TINYINT DEFAULT 0 COMMENT '支付状态：0待支付，1已支付，2已退款',
ADD COLUMN payment_order_no VARCHAR(64) NULL COMMENT '支付订单号',
ADD COLUMN payment_amount DECIMAL(10,2) NULL COMMENT '实际支付金额';

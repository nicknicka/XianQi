-- ============================================================================
-- XianQi 数据库基线结构
-- 约定：业务主键/外键统一使用 signed BIGINT；时间字段统一 created_at/updated_at。
-- 本脚本设计用于 MySQL 8.0 空库首次初始化。
-- ============================================================================

SET NAMES utf8mb4;

-- 表定义将按依赖顺序补齐；外键在所有表创建后统一添加。


-- ----------------------------------------------------------------------------
-- 用户与认证域
-- ----------------------------------------------------------------------------
CREATE TABLE `user` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `username` VARCHAR(50) NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '登录密码（BCrypt）',
  `pay_password` VARCHAR(255) NULL COMMENT '支付密码（BCrypt）',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) NULL COMMENT '头像URL',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `phone_verified` TINYINT NOT NULL DEFAULT 0 COMMENT '手机号是否验证',
  `student_id` VARCHAR(50) NULL COMMENT '学号',
  `real_name` VARCHAR(50) NULL COMMENT '真实姓名',
  `college` VARCHAR(100) NULL COMMENT '学院',
  `major` VARCHAR(100) NULL COMMENT '专业',
  `gender` TINYINT NULL COMMENT '性别：0-未知，1-男，2-女',
  `birthday` DATE NULL COMMENT '生日',
  `bio` VARCHAR(200) NULL COMMENT '个人简介',
  `location` VARCHAR(100) NULL COMMENT '展示位置',
  `homepage` VARCHAR(200) NULL COMMENT '个人主页',
  `tags` VARCHAR(500) NULL COMMENT '个人标签（JSON数组）',
  `followers_count` INT NOT NULL DEFAULT 0 COMMENT '粉丝数',
  `following_count` INT NOT NULL DEFAULT 0 COMMENT '关注数',
  `products_count` INT NOT NULL DEFAULT 0 COMMENT '发布商品数',
  `favorites_count` INT NOT NULL DEFAULT 0 COMMENT '收藏数',
  `credit_score` INT NOT NULL DEFAULT 100 COMMENT '当前信用分',
  `credit_level` VARCHAR(32) NOT NULL DEFAULT 'good' COMMENT '信用等级',
  `total_positive_evaluations` INT NOT NULL DEFAULT 0 COMMENT '累计好评数',
  `total_neutral_evaluations` INT NOT NULL DEFAULT 0 COMMENT '累计中评数',
  `total_negative_evaluations` INT NOT NULL DEFAULT 0 COMMENT '累计差评数',
  `last_active_time` DATETIME NULL COMMENT '最后活跃时间',
  `last_credit_decay_time` DATETIME NULL COMMENT '上次信用衰减时间',
  `zhima_credit_score` INT NULL COMMENT '芝麻信用分',
  `zhima_auth_time` DATETIME NULL COMMENT '芝麻信用授权时间',
  `is_verified` TINYINT NOT NULL DEFAULT 0 COMMENT '是否实名认证',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-正常，1-封禁，2-冻结',
  `status_reason` VARCHAR(255) NULL COMMENT '状态原因',
  `theme` VARCHAR(20) NOT NULL DEFAULT 'auto' COMMENT '主题',
  `auto_dark_mode` TINYINT NOT NULL DEFAULT 1 COMMENT '自动深色模式',
  `font_size` INT NOT NULL DEFAULT 16 COMMENT '字体大小',
  `device_type` VARCHAR(20) NULL COMMENT '常用设备类型',
  `language` VARCHAR(20) NOT NULL DEFAULT 'zh-CN' COMMENT '语言',
  `notification_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用通知',
  `sound_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用提示音',
  `vibration_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用振动',
  `phone_search_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT '是否允许手机号搜索',
  `location_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否显示位置',
  `wechat_openid` VARCHAR(100) NULL COMMENT '微信OpenID',
  `wechat_unionid` VARCHAR(100) NULL COMMENT '微信UnionID',
  `qq_openid` VARCHAR(100) NULL COMMENT 'QQ OpenID',
  `last_login_time` DATETIME NULL COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_wechat_openid` (`wechat_openid`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE `user_real_name_auth` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '认证流水ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `id_card` VARCHAR(100) NOT NULL COMMENT '身份证号（加密）',
  `id_card_front` VARCHAR(500) NULL COMMENT '身份证正面',
  `id_card_back` VARCHAR(500) NULL COMMENT '身份证背面',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '认证状态',
  `reject_reason` VARCHAR(255) NULL COMMENT '驳回原因',
  `audited_by` BIGINT NULL COMMENT '审核管理员ID',
  `audited_at` DATETIME NULL COMMENT '审核时间',
  `auth_provider` VARCHAR(50) NULL COMMENT '认证提供方',
  `auth_transaction_id` VARCHAR(100) NULL COMMENT '认证流水号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_status` (`status`), KEY `idx_audited_by` (`audited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户实名认证表';

CREATE TABLE `user_student_auth` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '认证流水ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `student_id` VARCHAR(50) NOT NULL COMMENT '学号',
  `college` VARCHAR(100) NOT NULL COMMENT '学院',
  `major` VARCHAR(100) NOT NULL COMMENT '专业',
  `enrollment_year` INT NULL COMMENT '入学年份',
  `graduation_year` INT NULL COMMENT '毕业年份',
  `education_level` VARCHAR(20) NULL COMMENT '培养层次',
  `student_card_images` JSON NULL COMMENT '学生证图片',
  `enrollment_certificate` VARCHAR(500) NULL COMMENT '在读证明',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '认证状态',
  `reject_reason` VARCHAR(255) NULL COMMENT '驳回原因',
  `audited_by` BIGINT NULL COMMENT '审核管理员ID',
  `audited_at` DATETIME NULL COMMENT '审核时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_student_id` (`student_id`),
  KEY `idx_status` (`status`), KEY `idx_audited_by` (`audited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生认证表';

CREATE TABLE `login_device` (
  `device_id` BIGINT NOT NULL COMMENT '设备ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `device_name` VARCHAR(100) NULL COMMENT '设备名称',
  `device_type` VARCHAR(20) NOT NULL COMMENT '设备类型',
  `platform` VARCHAR(50) NULL COMMENT '平台',
  `device_identifier` VARCHAR(100) NOT NULL COMMENT '设备唯一标识',
  `login_ip` VARCHAR(50) NOT NULL COMMENT '登录IP',
  `login_location` VARCHAR(100) NULL COMMENT '登录地点',
  `last_login_time` DATETIME NOT NULL COMMENT '最后登录时间',
  `is_current` TINYINT NOT NULL DEFAULT 0 COMMENT '是否当前设备',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-移除，1-有效',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uk_user_device` (`user_id`, `device_identifier`),
  KEY `idx_user_id` (`user_id`), KEY `idx_device_identifier` (`device_identifier`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录设备表';

CREATE TABLE `user_address` (
  `address_id` BIGINT NOT NULL COMMENT '地址ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `contact_name` VARCHAR(50) NOT NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
  `province` VARCHAR(50) NOT NULL COMMENT '省份',
  `city` VARCHAR(50) NOT NULL COMMENT '城市',
  `district` VARCHAR(50) NOT NULL COMMENT '区县',
  `detail_address` VARCHAR(200) NOT NULL COMMENT '详细地址',
  `postal_code` VARCHAR(10) NULL COMMENT '邮编',
  `tag` VARCHAR(20) NULL COMMENT '标签',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认',
  `longitude` DECIMAL(10,7) NULL COMMENT '经度',
  `latitude` DECIMAL(10,7) NULL COMMENT '纬度',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-删除，1-有效',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`address_id`), KEY `idx_user_id` (`user_id`), KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户地址表';

CREATE TABLE `user_follow` (
  `follow_id` BIGINT NOT NULL COMMENT '关注关系ID',
  `follower_id` BIGINT NOT NULL COMMENT '关注者ID',
  `following_id` BIGINT NOT NULL COMMENT '被关注者ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`follow_id`),
  UNIQUE KEY `uk_follower_following` (`follower_id`, `following_id`),
  KEY `idx_following_id` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注表';

CREATE TABLE `blacklist` (
  `blacklist_id` BIGINT NOT NULL COMMENT '黑名单ID',
  `user_id` BIGINT NOT NULL COMMENT '拉黑用户ID',
  `blocked_user_id` BIGINT NOT NULL COMMENT '被拉黑用户ID',
  `reason` VARCHAR(255) NULL COMMENT '拉黑原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`blacklist_id`),
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`),
  KEY `idx_blocked_user_id` (`blocked_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户黑名单表';

CREATE TABLE `admin` (
  `admin_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码（BCrypt）',
  `nickname` VARCHAR(50) NULL COMMENT '昵称',
  `avatar` VARCHAR(255) NULL COMMENT '头像',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用',
  `last_login_time` DATETIME NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) NULL COMMENT '最后登录IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`admin_id`), UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

CREATE TABLE `admin_login_log` (
  `log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id` BIGINT NULL COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `login_time` DATETIME NOT NULL COMMENT '登录时间',
  `ip` VARCHAR(50) NULL COMMENT 'IP', `location` VARCHAR(100) NULL COMMENT '归属地',
  `browser` VARCHAR(100) NULL COMMENT '浏览器', `os` VARCHAR(100) NULL COMMENT '操作系统',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态', `message` VARCHAR(255) NULL COMMENT '消息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`log_id`), KEY `idx_admin_id` (`admin_id`), KEY `idx_login_time` (`login_time`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员登录日志表';

CREATE TABLE `admin_session` (
  `session_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `admin_id` BIGINT NOT NULL COMMENT '管理员ID',
  `token` VARCHAR(500) NOT NULL COMMENT 'JWT Token',
  `ip` VARCHAR(50) NULL COMMENT 'IP', `user_agent` VARCHAR(500) NULL COMMENT 'User-Agent',
  `login_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `last_active_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`session_id`), KEY `idx_admin_id` (`admin_id`), KEY `idx_token` (`token`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员会话表';

CREATE TABLE `category` (
  `category_id` BIGINT NOT NULL COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL COMMENT '名称',
  `code` VARCHAR(50) NOT NULL COMMENT '编码',
  `parent_id` BIGINT NOT NULL DEFAULT 0 COMMENT '父分类ID',
  `icon` VARCHAR(500) NULL COMMENT '图标',
  `gradient` VARCHAR(255) NULL COMMENT '渐变色',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`category_id`), UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_id` (`parent_id`), KEY `idx_status` (`status`), KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ----------------------------------------------------------------------------
-- 商品与共享域
-- ----------------------------------------------------------------------------
CREATE TABLE `product` (
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `seller_id` BIGINT NOT NULL COMMENT '卖家ID',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `description` TEXT NULL COMMENT '描述',
  `category_id` BIGINT NOT NULL COMMENT '分类ID',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `original_price` DECIMAL(10,2) NULL COMMENT '原价',
  `condition_level` TINYINT NULL COMMENT '成色',
  `cover_image_id` BIGINT NULL COMMENT '封面图片ID',
  `image_count` INT NOT NULL DEFAULT 0 COMMENT '图片数',
  `location` VARCHAR(100) NULL COMMENT '交易地点',
  `latitude` DECIMAL(10,7) NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) NULL COMMENT '经度',
  `can_delivery` TINYINT NOT NULL DEFAULT 0 COMMENT '是否支持邮寄',
  `delivery_fee` DECIMAL(10,2) NULL DEFAULT 0 COMMENT '配送费',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览数',
  `audit_status` TINYINT NOT NULL DEFAULT 1 COMMENT '审核状态',
  `audit_remark` VARCHAR(255) NULL COMMENT '审核备注',
  `audit_time` DATETIME NULL COMMENT '审核时间',
  `auditor_id` BIGINT NULL COMMENT '审核管理员ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`product_id`),
  KEY `idx_seller_id` (`seller_id`), KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`), KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`), KEY `idx_location` (`location`(50)),
  FULLTEXT KEY `ft_title_desc` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

CREATE TABLE `product_image` (
  `image_id` BIGINT NOT NULL COMMENT '图片ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `image_uuid` VARCHAR(64) NULL COMMENT '图片UUID',
  `file_extension` VARCHAR(20) NULL COMMENT '扩展名',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` VARCHAR(500) NULL COMMENT '缩略图',
  `image_medium_url` VARCHAR(500) NULL COMMENT '中图',
  `sort_order` TINYINT NOT NULL DEFAULT 0 COMMENT '排序',
  `file_size` INT NULL COMMENT '文件大小',
  `width` SMALLINT NULL COMMENT '宽', `height` SMALLINT NULL COMMENT '高',
  `is_cover` TINYINT NOT NULL DEFAULT 0 COMMENT '是否封面',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`image_id`), KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品图片表';

CREATE TABLE `product_favorite` (
  `favorite_id` BIGINT NOT NULL COMMENT '收藏ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品收藏表';

CREATE TABLE `product_view_history` (
  `view_id` BIGINT NOT NULL COMMENT '浏览记录ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `view_time` DATETIME NOT NULL COMMENT '浏览时间',
  `view_duration` INT NOT NULL DEFAULT 0 COMMENT '浏览时长',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`view_id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_product_id` (`product_id`), KEY `idx_view_time` (`view_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品浏览历史表';

CREATE TABLE `product_statistics` (
  `stat_id` BIGINT NOT NULL COMMENT '统计ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览数',
  `favorite_count` INT NOT NULL DEFAULT 0 COMMENT '收藏数',
  `image_count` INT NOT NULL DEFAULT 0 COMMENT '图片数',
  `cover_image_id` BIGINT NULL COMMENT '封面图片ID',
  `cover_image_url` VARCHAR(500) NULL COMMENT '封面图片URL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`stat_id`), UNIQUE KEY `uk_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品统计表';

CREATE TABLE `share_item` (
  `share_id` BIGINT NOT NULL COMMENT '共享物品ID',
  `owner_id` BIGINT NOT NULL COMMENT '所有者ID',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `description` TEXT NULL COMMENT '描述',
  `category_id` BIGINT NOT NULL COMMENT '分类ID',
  `deposit` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '押金',
  `daily_rent` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '日租金',
  `condition_level` TINYINT NULL COMMENT '成色',
  `cover_image_id` BIGINT NULL COMMENT '封面图片ID',
  `image_count` INT NOT NULL DEFAULT 0 COMMENT '图片数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `available_times` JSON NULL COMMENT '可借用时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`share_id`),
  KEY `idx_owner_id` (`owner_id`), KEY `idx_category_id` (`category_id`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共享物品表';

CREATE TABLE `share_item_image` (
  `image_id` BIGINT NOT NULL COMMENT '图片ID',
  `share_id` BIGINT NOT NULL COMMENT '共享物品ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` VARCHAR(500) NULL COMMENT '缩略图',
  `image_medium_url` VARCHAR(500) NULL COMMENT '中图',
  `sort_order` TINYINT NOT NULL DEFAULT 0 COMMENT '排序',
  `file_size` INT NULL COMMENT '文件大小',
  `width` SMALLINT NULL, `height` SMALLINT NULL,
  `is_cover` TINYINT NOT NULL DEFAULT 0 COMMENT '是否封面',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`image_id`), KEY `idx_share_id` (`share_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共享物品图片表';

CREATE TABLE `share_item_booking` (
  `booking_id` BIGINT NOT NULL COMMENT '预约ID',
  `share_id` BIGINT NOT NULL COMMENT '共享物品ID',
  `owner_id` BIGINT NOT NULL COMMENT '所有者ID',
  `borrower_id` BIGINT NOT NULL COMMENT '借用者ID',
  `start_date` DATE NOT NULL, `end_date` DATE NOT NULL,
  `days` INT NOT NULL, `total_rent` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `deposit` DECIMAL(10,2) NOT NULL DEFAULT 0, `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `remark` TEXT NULL, `status` TINYINT NOT NULL DEFAULT 0,
  `start_time` DATETIME NULL, `approve_time` DATETIME NULL,
  `approve_remark` VARCHAR(500) NULL, `return_time` DATETIME NULL,
  `return_remark` VARCHAR(500) NULL, `deposit_paid_time` DATETIME NULL,
  `pay_time` DATETIME NULL, `payment_status` TINYINT NOT NULL DEFAULT 0,
  `payment_order_no` VARCHAR(50) NULL, `payment_amount` DECIMAL(10,2) NULL,
  `deposit_returned` TINYINT NOT NULL DEFAULT 0, `deposit_return_time` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `idx_share_id` (`share_id`), KEY `idx_owner_id` (`owner_id`),
  KEY `idx_borrower_id` (`borrower_id`), KEY `idx_status` (`status`),
  KEY `idx_payment_order_no` (`payment_order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共享物品预约表';

CREATE TABLE `deposit_record` (
  `record_id` BIGINT NOT NULL COMMENT '押金记录ID',
  `booking_id` BIGINT NOT NULL COMMENT '预约ID',
  `share_id` BIGINT NOT NULL COMMENT '共享物品ID',
  `user_id` BIGINT NOT NULL COMMENT '支付用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '押金金额',
  `payment_method` TINYINT NULL COMMENT '支付方式',
  `transaction_no` VARCHAR(64) NULL COMMENT '交易流水号',
  `out_trade_no` VARCHAR(64) NULL COMMENT '商户订单号',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '押金状态',
  `pay_time` DATETIME NULL, `refund_time` DATETIME NULL,
  `refund_remark` VARCHAR(500) NULL, `deduct_reason` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`), UNIQUE KEY `uk_transaction_no` (`transaction_no`),
  KEY `idx_booking_id` (`booking_id`), KEY `idx_share_id` (`share_id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='押金记录表';

-- ----------------------------------------------------------------------------
-- 订单、退款、评价与信用域
-- ----------------------------------------------------------------------------
CREATE TABLE `coupon` (
  `coupon_id` BIGINT NOT NULL COMMENT '优惠券ID',
  `name` VARCHAR(100) NOT NULL COMMENT '名称',
  `description` VARCHAR(500) NULL COMMENT '描述',
  `type` TINYINT NOT NULL COMMENT '类型：1-满减，2-折扣，3-免邮',
  `min_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '门槛金额',
  `discount_value` DECIMAL(10,2) NOT NULL COMMENT '优惠值',
  `max_discount` DECIMAL(10,2) NULL COMMENT '最大优惠金额',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '发行数量',
  `received_count` INT NOT NULL DEFAULT 0 COMMENT '已领取数量',
  `used_count` INT NOT NULL DEFAULT 0 COMMENT '已使用数量',
  `limit_per_user` INT NOT NULL DEFAULT 1 COMMENT '每人限领',
  `scope` TINYINT NOT NULL DEFAULT 1 COMMENT '使用范围',
  `category_ids` JSON NULL COMMENT '适用分类ID',
  `product_ids` JSON NULL COMMENT '适用商品ID',
  `valid_start_time` DATETIME NOT NULL COMMENT '生效开始时间',
  `valid_end_time` DATETIME NOT NULL COMMENT '生效结束时间',
  `image_url` VARCHAR(500) NULL COMMENT '图片URL',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`coupon_id`),
  KEY `idx_status` (`status`),
  KEY `idx_valid_time` (`valid_start_time`, `valid_end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

CREATE TABLE `order` (
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
  `buyer_id` BIGINT NOT NULL COMMENT '买家ID',
  `seller_id` BIGINT NOT NULL COMMENT '卖家ID',
  `product_id` BIGINT NULL COMMENT '商品ID',
  `share_id` BIGINT NULL COMMENT '共享物品ID',
  `coupon_id` BIGINT NULL COMMENT '优惠券ID',
  `address_id` BIGINT NULL COMMENT '收货地址ID',
  `type` TINYINT NOT NULL COMMENT '类型：1-购买，2-共享',
  `order_type` TINYINT NOT NULL DEFAULT 0 COMMENT '订单类型',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `pay_time` DATETIME NULL COMMENT '支付时间',
  `ship_time` DATETIME NULL COMMENT '发货时间',
  `deliver_time` DATETIME NULL COMMENT '送达时间',
  `confirm_time` DATETIME NULL COMMENT '确认时间',
  `complete_time` DATETIME NULL COMMENT '完成时间',
  `cancel_time` DATETIME NULL COMMENT '取消时间',
  `cancel_reason` VARCHAR(255) NULL COMMENT '取消原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_address_id` (`address_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

CREATE TABLE `user_coupon` (
  `user_coupon_id` BIGINT NOT NULL COMMENT '用户优惠券ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `coupon_id` BIGINT NOT NULL COMMENT '优惠券ID',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-未使用，2-已使用，3-已过期',
  `used_time` DATETIME NULL COMMENT '使用时间',
  `order_id` BIGINT NULL COMMENT '订单ID',
  `expire_time` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_coupon_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';

CREATE TABLE `evaluation` (
  `evaluation_id` BIGINT NOT NULL COMMENT '评价ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `evaluator_id` BIGINT NOT NULL COMMENT '评价人ID',
  `target_user_id` BIGINT NOT NULL COMMENT '被评价人ID',
  `rating` TINYINT NOT NULL COMMENT '评分：1-5',
  `content` TEXT NULL COMMENT '评价内容',
  `tags` JSON NULL COMMENT '标签',
  `images` JSON NULL COMMENT '图片',
  `append_content` TEXT NULL COMMENT '追评内容',
  `append_images` JSON NULL COMMENT '追评图片',
  `append_time` DATETIME NULL COMMENT '追评时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`evaluation_id`),
  UNIQUE KEY `uk_order_evaluator` (`order_id`, `evaluator_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_target_user_id` (`target_user_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

CREATE TABLE `refund_record` (
  `refund_id` BIGINT NOT NULL COMMENT '退款记录ID',
  `refund_no` VARCHAR(50) NOT NULL COMMENT '退款单号',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `user_id` BIGINT NOT NULL COMMENT '申请用户ID',
  `refund_amount` DECIMAL(10,2) NOT NULL COMMENT '退款金额',
  `refund_reason` VARCHAR(255) NOT NULL COMMENT '退款原因',
  `refund_type` TINYINT NOT NULL DEFAULT 1 COMMENT '退款类型',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `reject_reason` VARCHAR(255) NULL COMMENT '拒绝原因',
  `logistics_company` VARCHAR(100) NULL COMMENT '物流公司',
  `logistics_no` VARCHAR(100) NULL COMMENT '物流单号',
  `logistics_time` DATETIME NULL COMMENT '物流发出时间',
  `evidence_images` JSON NULL COMMENT '凭证图片',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `process_time` DATETIME NULL COMMENT '处理完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`refund_id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款记录表';

CREATE TABLE `transfer_record` (
  `transfer_id` BIGINT NOT NULL COMMENT '转赠记录ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `share_id` BIGINT NOT NULL COMMENT '共享物品ID',
  `from_user_id` BIGINT NOT NULL COMMENT '转出用户ID',
  `to_user_id` BIGINT NOT NULL COMMENT '接收用户ID',
  `transfer_note` VARCHAR(500) NULL COMMENT '转赠说明',
  `accept_status` TINYINT NOT NULL DEFAULT 0 COMMENT '确认状态',
  `confirm_time` DATETIME NULL COMMENT '确认时间',
  `reject_reason` VARCHAR(255) NULL COMMENT '拒绝原因',
  `complete_time` DATETIME NULL COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`transfer_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_status` (`accept_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转赠记录表';

CREATE TABLE `credit_record` (
  `record_id` BIGINT NOT NULL COMMENT '记录ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `score_before` INT NOT NULL COMMENT '变化前分数',
  `score_change` DECIMAL(5,2) NOT NULL COMMENT '变化分数',
  `score_after` INT NOT NULL COMMENT '变化后分数',
  `reason` VARCHAR(50) NOT NULL COMMENT '变化原因编码',
  `reason_detail` VARCHAR(500) NULL COMMENT '原因详情',
  `related_type` VARCHAR(32) NULL COMMENT '关联类型',
  `related_id` BIGINT NULL COMMENT '关联业务ID',
  `operator_id` BIGINT NULL COMMENT '操作人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_reason` (`reason`),
  KEY `idx_related` (`related_type`, `related_id`),
  KEY `idx_operator_id` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用分变动记录表';

CREATE TABLE `credit_daily_stat` (
  `stat_id` BIGINT NOT NULL COMMENT '统计ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `transaction_gain` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '交易加分',
  `transaction_count` INT NOT NULL DEFAULT 0 COMMENT '交易次数',
  `evaluation_gain` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '评价加分',
  `evaluation_count` INT NOT NULL DEFAULT 0 COMMENT '评价次数',
  `other_gain` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '其他加分',
  `total_gain` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '总加分',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`stat_id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `stat_date`),
  KEY `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用分每日统计表';

CREATE TABLE `credit_alert` (
  `alert_id` BIGINT NOT NULL COMMENT '预警ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `alert_type` VARCHAR(32) NOT NULL COMMENT '预警类型',
  `alert_level` VARCHAR(16) NOT NULL COMMENT '预警级别',
  `alert_data` JSON NULL COMMENT '预警数据',
  `status` VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  `handled_by` BIGINT NULL COMMENT '处理管理员ID',
  `handle_result` VARCHAR(500) NULL COMMENT '处理结果',
  `handled_at` DATETIME NULL COMMENT '处理时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`alert_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_alert_type` (`alert_type`),
  KEY `idx_alert_level` (`alert_level`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_handled_by` (`handled_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用分预警表';

-- ----------------------------------------------------------------------------
-- 聊天域
-- ----------------------------------------------------------------------------
CREATE TABLE `conversation` (
  `conversation_id` BIGINT NOT NULL COMMENT '会话ID',
  `conversation_type` TINYINT NOT NULL DEFAULT 1 COMMENT '会话类型',
  `user_id_1` BIGINT NOT NULL COMMENT '用户1 ID',
  `user_id_2` BIGINT NOT NULL COMMENT '用户2 ID',
  `related_order_id` BIGINT NULL COMMENT '关联订单ID',
  `related_product_id` BIGINT NULL COMMENT '关联商品ID',
  `related_share_id` BIGINT NULL COMMENT '关联共享物品ID',
  `last_message_id` BIGINT NULL COMMENT '最后消息ID',
  `last_message_content` VARCHAR(1000) NULL COMMENT '最后消息内容',
  `last_message_type` TINYINT NULL COMMENT '最后消息类型',
  `last_message_time` DATETIME NULL COMMENT '最后消息时间',
  `unread_count_user1` INT NOT NULL DEFAULT 0 COMMENT '用户1未读数',
  `unread_count_user2` INT NOT NULL DEFAULT 0 COMMENT '用户2未读数',
  `is_muted_user1` TINYINT NOT NULL DEFAULT 0 COMMENT '用户1是否免打扰',
  `is_muted_user2` TINYINT NOT NULL DEFAULT 0 COMMENT '用户2是否免打扰',
  `remark_user1` VARCHAR(100) NULL COMMENT '用户1备注',
  `remark_user2` VARCHAR(100) NULL COMMENT '用户2备注',
  `is_archived_user1` TINYINT NOT NULL DEFAULT 0 COMMENT '用户1是否归档',
  `is_archived_user2` TINYINT NOT NULL DEFAULT 0 COMMENT '用户2是否归档',
  `is_pinned_user1` TINYINT NOT NULL DEFAULT 0 COMMENT '用户1是否置顶',
  `is_pinned_user2` TINYINT NOT NULL DEFAULT 0 COMMENT '用户2是否置顶',
  `pin_order_user1` INT NULL COMMENT '用户1置顶排序',
  `pin_order_user2` INT NULL COMMENT '用户2置顶排序',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`conversation_id`),
  KEY `idx_user_id_1` (`user_id_1`),
  KEY `idx_user_id_2` (`user_id_2`),
  KEY `idx_related_order_id` (`related_order_id`),
  KEY `idx_product_id` (`related_product_id`),
  KEY `idx_share_id` (`related_share_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

CREATE TABLE `conversation_member` (
  `member_id` BIGINT NOT NULL COMMENT '成员ID',
  `conversation_id` BIGINT NOT NULL COMMENT '会话ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `nickname` VARCHAR(50) NULL COMMENT '群昵称',
  `unread_count` INT NOT NULL DEFAULT 0 COMMENT '未读数',
  `is_muted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否免打扰',
  `join_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_read_time` DATETIME NULL COMMENT '最后已读时间',
  `last_read_message_id` BIGINT NULL COMMENT '最后已读消息ID',
  `deleted_by_user` TINYINT NOT NULL DEFAULT 0 COMMENT '成员是否删除会话',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

CREATE TABLE `message` (
  `message_id` BIGINT NOT NULL COMMENT '消息ID',
  `conversation_id` BIGINT NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `receiver_id` BIGINT NULL COMMENT '接收者ID',
  `content` TEXT NULL COMMENT '消息内容',
  `type` TINYINT NOT NULL COMMENT '消息类型',
  `parent_message_id` BIGINT NULL COMMENT '父消息ID',
  `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读',
  `read_time` DATETIME NULL COMMENT '阅读时间',
  `send_status` TINYINT NOT NULL DEFAULT 1 COMMENT '发送状态',
  `delivered_time` DATETIME NULL COMMENT '送达时间',
  `extra_data` JSON NULL COMMENT '扩展数据',
  `reply_count` INT NOT NULL DEFAULT 0 COMMENT '回复数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '消息状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_parent_message_id` (`parent_message_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

CREATE TABLE `quick_reply` (
  `reply_id` BIGINT NOT NULL COMMENT '快捷回复ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `content` VARCHAR(500) NOT NULL COMMENT '内容',
  `category` VARCHAR(50) NULL COMMENT '分类',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统回复',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`reply_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快捷回复表';

-- ----------------------------------------------------------------------------
-- 营销、秒杀、通知、配置与审计域
-- ----------------------------------------------------------------------------
CREATE TABLE `banner` (
  `banner_id` BIGINT NOT NULL COMMENT '轮播图ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` VARCHAR(500) NULL COMMENT '缩略图URL',
  `link_type` TINYINT NOT NULL DEFAULT 1 COMMENT '链接类型',
  `link_url` VARCHAR(500) NULL COMMENT '链接URL',
  `link_product_id` BIGINT NULL COMMENT '关联商品ID',
  `link_page_path` VARCHAR(200) NULL COMMENT '功能页路径',
  `position` VARCHAR(50) NOT NULL DEFAULT 'home' COMMENT '展示位置',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `start_time` DATETIME NULL COMMENT '开始时间',
  `end_time` DATETIME NULL COMMENT '结束时间',
  `click_count` INT NOT NULL DEFAULT 0 COMMENT '点击数',
  `exposure_count` INT NOT NULL DEFAULT 0 COMMENT '曝光数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`banner_id`),
  KEY `idx_status` (`status`), KEY `idx_position` (`position`),
  KEY `idx_sort_order` (`sort_order`), KEY `idx_link_product_id` (`link_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

CREATE TABLE `flash_sale_session` (
  `session_id` BIGINT NOT NULL COMMENT '秒杀场次ID',
  `name` VARCHAR(100) NOT NULL COMMENT '场次名称',
  `description` VARCHAR(500) NULL COMMENT '描述',
  `session_time` VARCHAR(10) NULL COMMENT '场次时间点',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `session_type` TINYINT NOT NULL DEFAULT 1 COMMENT '场次类型',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-停用，1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`session_id`),
  KEY `idx_status` (`status`), KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='秒杀场次表';

CREATE TABLE `flash_sale_product` (
  `flash_sale_id` BIGINT NOT NULL COMMENT '秒杀商品ID',
  `session_id` BIGINT NOT NULL COMMENT '秒杀场次ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `flash_price` DECIMAL(10,2) NOT NULL COMMENT '秒杀价',
  `stock_count` INT NOT NULL DEFAULT 1 COMMENT '库存',
  `sold_count` INT NOT NULL DEFAULT 0 COMMENT '已售数量',
  `limit_per_user` INT NOT NULL DEFAULT 1 COMMENT '每人限购',
  `repeat_type` TINYINT NOT NULL DEFAULT 1 COMMENT '重复类型',
  `sale_date` DATE NULL COMMENT '指定秒杀日期',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-在售，1-售罄，2-下架',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`flash_sale_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='秒杀商品表';

CREATE TABLE `flash_sale_session_template` (
  `template_id` BIGINT NOT NULL COMMENT '模板ID',
  `name` VARCHAR(100) NOT NULL COMMENT '名称',
  `session_time` VARCHAR(10) NOT NULL COMMENT '时间点',
  `duration_hours` INT NOT NULL DEFAULT 2 COMMENT '持续小时数',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`template_id`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='秒杀场次模板表';

CREATE TABLE `flash_sale_order_ext` (
  `ext_id` BIGINT NOT NULL COMMENT '扩展记录ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `flash_sale_id` BIGINT NOT NULL COMMENT '秒杀商品ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `flash_price` DECIMAL(10,2) NOT NULL COMMENT '成交价',
  `discount` DECIMAL(3,1) NULL COMMENT '折扣',
  `seckill_time` DATETIME NOT NULL COMMENT '抢购时间',
  `client_ip` VARCHAR(50) NULL COMMENT '客户端IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`ext_id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_flash_sale_id` (`flash_sale_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_seckill_time` (`seckill_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='秒杀订单扩展表';

CREATE TABLE `hot_tag` (
  `tag_id` BIGINT NOT NULL COMMENT '热门标签ID',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `heat` INT NOT NULL DEFAULT 0 COMMENT '热度',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_status` (`status`), KEY `idx_heat` (`heat` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门标签表';

CREATE TABLE `system_config` (
  `config_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT NULL COMMENT '配置值',
  `config_type` VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '配置类型',
  `value_options` JSON NULL COMMENT '可选值',
  `description` VARCHAR(500) NULL COMMENT '说明',
  `group_name` VARCHAR(50) NOT NULL DEFAULT 'basic' COMMENT '分组',
  `is_public` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公开',
  `is_system` TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统内置',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_group_name` (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

CREATE TABLE `system_notification` (
  `notification_id` BIGINT NOT NULL COMMENT '通知ID',
  `sender_id` BIGINT NULL COMMENT '发送管理员ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` TEXT NULL COMMENT '内容',
  `type` TINYINT NOT NULL COMMENT '类型',
  `target_type` TINYINT NOT NULL DEFAULT 1 COMMENT '目标类型',
  `target_users` JSON NULL COMMENT '指定用户',
  `target_level` INT NULL COMMENT '目标等级',
  `link_type` TINYINT NULL COMMENT '链接类型',
  `link_url` VARCHAR(500) NULL COMMENT '链接URL',
  `link_product_id` BIGINT NULL COMMENT '关联商品ID',
  `link_order_id` BIGINT NULL COMMENT '关联订单ID',
  `publish_time` DATETIME NULL COMMENT '发布时间',
  `end_time` DATETIME NULL COMMENT '结束展示时间',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态',
  `priority` TINYINT NOT NULL DEFAULT 2 COMMENT '优先级',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`notification_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_type` (`type`),
  KEY `idx_link_product_id` (`link_product_id`),
  KEY `idx_link_order_id` (`link_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

CREATE TABLE `notification_read_records` (
  `record_id` BIGINT NOT NULL COMMENT '阅读记录ID',
  `notification_id` BIGINT NOT NULL COMMENT '通知ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `read_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`),
  UNIQUE KEY `uk_notification_user` (`notification_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知阅读记录表';

CREATE TABLE `operation_log` (
  `log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id` BIGINT NULL COMMENT '管理员ID',
  `username` VARCHAR(50) NULL COMMENT '用户名',
  `biz_id` BIGINT NULL COMMENT '业务对象ID',
  `biz_type` VARCHAR(50) NULL COMMENT '业务对象类型',
  `module` VARCHAR(50) NULL COMMENT '模块',
  `action` VARCHAR(50) NULL COMMENT '操作类型',
  `description` VARCHAR(500) NULL COMMENT '描述',
  `request_method` VARCHAR(10) NULL COMMENT '请求方法',
  `request_url` VARCHAR(500) NULL COMMENT '请求URL',
  `request_params` JSON NULL COMMENT '请求参数',
  `response_result` JSON NULL COMMENT '响应结果',
  `ip_address` VARCHAR(50) NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) NULL COMMENT 'User-Agent',
  `execute_time` BIGINT NULL COMMENT '执行时长',
  `status` TINYINT NULL COMMENT '执行状态',
  `error_message` TEXT NULL COMMENT '错误信息',
  `oper_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_admin_id` (`admin_id`), KEY `idx_oper_time` (`oper_time`), KEY `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

CREATE TABLE `report` (
  `report_id` BIGINT NOT NULL COMMENT '举报ID',
  `reporter_id` BIGINT NOT NULL COMMENT '举报人ID',
  `target_type` VARCHAR(32) NOT NULL COMMENT '举报对象类型',
  `target_id` BIGINT NOT NULL COMMENT '举报对象ID',
  `reason` VARCHAR(255) NOT NULL COMMENT '原因',
  `description` TEXT NULL COMMENT '描述',
  `evidence_images` JSON NULL COMMENT '证据图片',
  `type` TINYINT NOT NULL DEFAULT 0 COMMENT '举报类型',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '处理状态',
  `handler_id` BIGINT NULL COMMENT '处理管理员ID',
  `handle_note` VARCHAR(500) NULL COMMENT '处理备注',
  `handle_time` DATETIME NULL COMMENT '处理时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`report_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_status` (`status`), KEY `idx_type` (`type`),
  KEY `idx_handler_id` (`handler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报记录表';

CREATE TABLE `user_feedback` (
  `feedback_id` BIGINT NOT NULL COMMENT '反馈ID',
  `user_id` BIGINT NULL COMMENT '用户ID',
  `contact` VARCHAR(100) NULL COMMENT '联系方式',
  `type` TINYINT NOT NULL DEFAULT 1 COMMENT '反馈类型',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `images` JSON NULL COMMENT '图片',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '处理状态',
  `handler_id` BIGINT NULL COMMENT '处理管理员ID',
  `handle_note` VARCHAR(500) NULL COMMENT '处理备注',
  `reply_time` DATETIME NULL COMMENT '回复时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`feedback_id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_status` (`status`),
  KEY `idx_type` (`type`), KEY `idx_handler_id` (`handler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

CREATE TABLE `sensitive_word` (
  `word_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '敏感词ID',
  `word` VARCHAR(100) NOT NULL COMMENT '敏感词',
  `type` TINYINT NOT NULL COMMENT '类型',
  `replace_word` VARCHAR(100) NULL COMMENT '替换词',
  `level` TINYINT NOT NULL DEFAULT 1 COMMENT '等级',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`word_id`),
  UNIQUE KEY `uk_word` (`word`),
  KEY `idx_type` (`type`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';

CREATE TABLE `campus_location` (
  `location_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '校园位置ID',
  `name` VARCHAR(50) NOT NULL COMMENT '名称',
  `code` VARCHAR(50) NOT NULL COMMENT '编码',
  `description` VARCHAR(200) NULL COMMENT '描述',
  `parent_id` BIGINT NULL COMMENT '父位置ID',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`), KEY `idx_sort_order` (`sort_order`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校园位置表';

CREATE TABLE `ai_chat_history` (
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

-- ----------------------------------------------------------------------------
-- 外键约束（仅声明 spec 中明确建模的关系；所有键列均为 signed BIGINT）
-- ----------------------------------------------------------------------------
ALTER TABLE `category`
  MODIFY COLUMN `parent_id` BIGINT NULL DEFAULT NULL COMMENT '父分类ID，NULL表示顶级',
  ADD CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `category` (`category_id`);

ALTER TABLE `user_real_name_auth`
  ADD CONSTRAINT `fk_user_real_name_auth_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `user_student_auth`
  ADD CONSTRAINT `fk_user_student_auth_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `login_device`
  ADD CONSTRAINT `fk_login_device_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `user_address`
  ADD CONSTRAINT `fk_user_address_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `user_follow`
  ADD CONSTRAINT `fk_user_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_user_follow_following` FOREIGN KEY (`following_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `blacklist`
  ADD CONSTRAINT `fk_blacklist_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_blacklist_blocked_user` FOREIGN KEY (`blocked_user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `admin_login_log`
  ADD CONSTRAINT `fk_admin_login_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`);
ALTER TABLE `admin_session`
  ADD CONSTRAINT `fk_admin_session_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`);

ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  ADD CONSTRAINT `fk_product_auditor` FOREIGN KEY (`auditor_id`) REFERENCES `admin` (`admin_id`);
ALTER TABLE `product_image`
  ADD CONSTRAINT `fk_product_image_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;
ALTER TABLE `product_favorite`
  ADD CONSTRAINT `fk_product_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_favorite_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;
ALTER TABLE `product_view_history`
  ADD CONSTRAINT `fk_product_view_history_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_view_history_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;

ALTER TABLE `share_item`
  ADD CONSTRAINT `fk_share_item_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_share_item_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`);
ALTER TABLE `share_item_image`
  ADD CONSTRAINT `fk_share_item_image_share` FOREIGN KEY (`share_id`) REFERENCES `share_item` (`share_id`) ON DELETE CASCADE;
ALTER TABLE `share_item_booking`
  ADD CONSTRAINT `fk_share_item_booking_share` FOREIGN KEY (`share_id`) REFERENCES `share_item` (`share_id`),
  ADD CONSTRAINT `fk_share_item_booking_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_share_item_booking_borrower` FOREIGN KEY (`borrower_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `deposit_record`
  ADD CONSTRAINT `fk_deposit_record_booking` FOREIGN KEY (`booking_id`) REFERENCES `share_item_booking` (`booking_id`),
  ADD CONSTRAINT `fk_deposit_record_share` FOREIGN KEY (`share_id`) REFERENCES `share_item` (`share_id`),
  ADD CONSTRAINT `fk_deposit_record_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

ALTER TABLE `order`
  ADD CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_order_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupon` (`coupon_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_address` FOREIGN KEY (`address_id`) REFERENCES `user_address` (`address_id`) ON DELETE SET NULL;
ALTER TABLE `user_coupon`
  ADD CONSTRAINT `fk_user_coupon_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_user_coupon_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupon` (`coupon_id`),
  ADD CONSTRAINT `fk_user_coupon_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE SET NULL;
ALTER TABLE `evaluation`
  ADD CONSTRAINT `fk_evaluation_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `fk_evaluation_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `fk_evaluation_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_evaluation_target_user` FOREIGN KEY (`target_user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `refund_record`
  ADD CONSTRAINT `fk_refund_record_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `fk_refund_record_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `transfer_record`
  ADD CONSTRAINT `fk_transfer_record_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `fk_transfer_record_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_transfer_record_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `user` (`user_id`);

ALTER TABLE `credit_record`
  ADD CONSTRAINT `fk_credit_record_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `credit_daily_stat`
  ADD CONSTRAINT `fk_credit_daily_stat_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `credit_alert`
  ADD CONSTRAINT `fk_credit_alert_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_credit_alert_admin` FOREIGN KEY (`handled_by`) REFERENCES `admin` (`admin_id`);

ALTER TABLE `conversation`
  ADD CONSTRAINT `fk_conversation_product` FOREIGN KEY (`related_product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conversation_share` FOREIGN KEY (`related_share_id`) REFERENCES `share_item` (`share_id`) ON DELETE SET NULL;
ALTER TABLE `conversation_member`
  ADD CONSTRAINT `fk_conversation_member_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conversation_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `message`
  ADD CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `quick_reply`
  MODIFY COLUMN `user_id` BIGINT NULL COMMENT '用户ID，NULL表示系统预设',
  ADD CONSTRAINT `fk_quick_reply_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `banner`
  ADD CONSTRAINT `fk_banner_product` FOREIGN KEY (`link_product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL;
ALTER TABLE `flash_sale_product`
  ADD CONSTRAINT `fk_flash_sale_product_session` FOREIGN KEY (`session_id`) REFERENCES `flash_sale_session` (`session_id`),
  ADD CONSTRAINT `fk_flash_sale_product_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);
ALTER TABLE `flash_sale_order_ext`
  ADD CONSTRAINT `fk_flash_sale_order_ext_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`),
  ADD CONSTRAINT `fk_flash_sale_order_ext_flash_sale` FOREIGN KEY (`flash_sale_id`) REFERENCES `flash_sale_product` (`flash_sale_id`);

ALTER TABLE `system_notification`
  ADD CONSTRAINT `fk_system_notification_sender` FOREIGN KEY (`sender_id`) REFERENCES `admin` (`admin_id`);
ALTER TABLE `notification_read_records`
  ADD CONSTRAINT `fk_notification_read_records_notification` FOREIGN KEY (`notification_id`) REFERENCES `system_notification` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notification_read_records_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `operation_log`
  ADD CONSTRAINT `fk_operation_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`);
ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `fk_report_handler` FOREIGN KEY (`handler_id`) REFERENCES `admin` (`admin_id`);
ALTER TABLE `user_feedback`
  ADD CONSTRAINT `fk_user_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
ALTER TABLE `ai_chat_history`
  ADD CONSTRAINT `fk_ai_chat_history_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

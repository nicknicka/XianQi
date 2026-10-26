-- ============================================================================
-- 校园二手交易与共享平台 - 完整数据库创建脚本
-- ============================================================================
-- 项目名称：Xianqi（校园二手交易与共享平台）
-- 作者：许佳宜 (2022035123021)
-- 专业：计算机科学与技术(职教师资)
-- 指导教师：温清机
-- 生成时间：2026-03-12
-- ============================================================================
-- 说明：
--   本脚本包含完整的数据库表结构定义，共50张表
--   - User相关表（10张）：已重新设计，消除字段重复
--   - 业务表（39张）：包含所有业务功能
-- ============================================================================
-- 使用方法：
--   CREATE DATABASE Xianqi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE Xianqi;
--   source Xianqi_complete_database_schema_final.sql;
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 第一部分：User 相关表（重新设计）
-- ============================================================================

CREATE TABLE `user` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `username` VARCHAR(50) NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '登录密码（BCrypt加密）',
  `pay_password` VARCHAR(255) NULL COMMENT '支付密码（BCrypt加密）',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) NULL COMMENT '头像URL',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `phone_verified` TINYINT NOT NULL DEFAULT 0 COMMENT '手机号是否已验证：0-否，1-是',

  -- 第三方登录
  `wechat_openid` VARCHAR(100) NULL COMMENT '微信OpenID',
  `wechat_unionid` VARCHAR(100) NULL COMMENT '微信UnionID',
  `qq_openid` VARCHAR(100) NULL COMMENT 'QQ OpenID',

  -- 用户状态
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '账号状态：0-正常，1-封禁，2-冻结',
  `status_reason` VARCHAR(255) NULL COMMENT '状态原因（封禁/冻结说明）',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已删除',

  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_wechat_openid` (`wechat_openid`),
  KEY `idx_wechat_unionid` (`wechat_unionid`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------------------------------------------------------
-- 3.2 用户资料扩展表 (user_profile)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_profile` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `real_name` VARCHAR(50) NULL COMMENT '真实姓名（用于展示，非认证信息）',
  `gender` TINYINT NULL COMMENT '性别：0-未知，1-男，2-女',
  `birthday` DATE NULL COMMENT '生日',
  `bio` VARCHAR(200) NULL COMMENT '个人简介',
  `location` VARCHAR(100) NULL COMMENT '位置展示（如：北京市海淀区）',
  `homepage` VARCHAR(200) NULL COMMENT '个人主页',
  `tags` VARCHAR(500) NULL COMMENT '个人标签（JSON数组）',

  -- 统计数据（冗余字段，提升查询性能）
  `followers_count` INT NOT NULL DEFAULT 0 COMMENT '粉丝数',
  `following_count` INT NOT NULL DEFAULT 0 COMMENT '关注数',
  `products_count` INT NOT NULL DEFAULT 0 COMMENT '发布商品数',
  `favorites_count` INT NOT NULL DEFAULT 0 COMMENT '收藏数',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`user_id`),
  KEY `idx_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户资料扩展表';

-- ----------------------------------------------------------------------------
-- 3.3 用户实名认证表 (user_real_name_auth)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_real_name_auth` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `id_card` VARCHAR(100) NOT NULL COMMENT '身份证号（AES加密）',
  `id_card_front` VARCHAR(500) NULL COMMENT '身份证正面图片',
  `id_card_back` VARCHAR(500) NULL COMMENT '身份证背面图片',

  -- 认证状态
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '认证状态：0-未认证，1-审核中，2-已认证，3-认证失败',
  `reject_reason` VARCHAR(255) NULL COMMENT '认证失败原因',

  -- 审核信息
  `audited_by` BIGINT NULL COMMENT '审核人ID',
  `audited_at` DATETIME NULL COMMENT '审核时间',

  -- 第三方认证（可选）
  `auth_provider` VARCHAR(50) NULL COMMENT '认证提供商：alipay/wechat/manual',
  `auth_transaction_id` VARCHAR(100) NULL COMMENT '第三方认证流水号',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '认证提交时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户实名认证表';

-- ----------------------------------------------------------------------------
-- 3.4 用户学生认证表 (user_student_auth)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_student_auth` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `student_id` VARCHAR(50) NOT NULL COMMENT '学号',
  `college` VARCHAR(100) NOT NULL COMMENT '学院',
  `major` VARCHAR(100) NOT NULL COMMENT '专业',
  `enrollment_year` CHAR(4) NULL COMMENT '入学年份',
  `graduation_year` CHAR(4) NULL COMMENT '毕业年份',
  `education_level` TINYINT NULL COMMENT '学历层次：1-专科，2-本科，3-硕士，4-博士',

  -- 认证材料
  `student_card_images` JSON NULL COMMENT '学生证图片（JSON数组）',
  `enrollment_certificate` VARCHAR(500) NULL COMMENT '录取通知书/学信网截图',

  -- 认证状态
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '认证状态：0-未认证，1-审核中，2-已认证，3-认证失败',
  `reject_reason` VARCHAR(255) NULL COMMENT '认证失败原因',

  -- 审核信息
  `audited_by` BIGINT NULL COMMENT '审核人ID',
  `audited_at` DATETIME NULL COMMENT '审核时间',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '认证提交时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_student_id` (`student_id`),
  KEY `idx_college_major` (`college`, `major`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学生认证表';

-- ----------------------------------------------------------------------------
-- 3.5 用户信用扩展表 (user_credit_ext)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_credit_ext` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `credit_score` INT NOT NULL DEFAULT 100 COMMENT '信用分数（默认100分）',

  -- 评价统计
  `total_positive` INT NOT NULL DEFAULT 0 COMMENT '好评数',
  `total_neutral` INT NOT NULL DEFAULT 0 COMMENT '中评数',
  `total_negative` INT NOT NULL DEFAULT 0 COMMENT '差评数',
  `total_evaluations` INT NOT NULL DEFAULT 0 COMMENT '总评价数',

  -- 信用分变动
  `last_credit_change` DATETIME NULL COMMENT '最后信用分变动时间',
  `last_credit_decay` DATETIME NULL COMMENT '上次信用分衰减时间',

  -- 第三方信用（可选）
  `zhima_credit_score` INT NULL COMMENT '芝麻信用分',
  `zhima_auth_time` DATETIME NULL COMMENT '芝麻信用授权时间',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`user_id`),
  KEY `idx_credit_score` (`credit_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信用扩展表';

-- ----------------------------------------------------------------------------
-- 3.6 用户登录设备表 (login_device)
-- ----------------------------------------------------------------------------
CREATE TABLE `login_device` (
  `device_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `device_name` VARCHAR(100) NULL COMMENT '设备名称（如：iPhone 13）',
  `device_type` VARCHAR(20) NOT NULL COMMENT '设备类型：ios/android/web/miniapp',
  `platform` VARCHAR(50) NULL COMMENT '平台标识（如：iOS 15.0）',
  `device_identifier` VARCHAR(100) NOT NULL COMMENT '设备唯一标识',

  -- 登录信息
  `login_ip` VARCHAR(50) NOT NULL COMMENT '登录IP',
  `login_location` VARCHAR(100) NULL COMMENT '登录地点',
  `last_login_time` DATETIME NOT NULL COMMENT '最后登录时间',

  -- 设备状态
  `is_current` TINYINT NOT NULL DEFAULT 0 COMMENT '是否为当前设备：0-否，1-是',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次登录时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uk_user_device` (`user_id`, `device_identifier`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_last_login` (`last_login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录设备表';

-- ----------------------------------------------------------------------------
-- 3.7 用户偏好设置表 (user_preference)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_preference` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',

  -- 外观设置
  `theme` VARCHAR(20) NOT NULL DEFAULT 'auto' COMMENT '主题：light-浅色，dark-深色，auto-跟随系统',
  `font_size` INT NOT NULL DEFAULT 16 COMMENT '字体大小（px）',

  -- 通知设置
  `notification_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用通知：0-关闭，1-开启',
  `sound_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用提示音：0-关闭，1-开启',
  `vibration_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用振动：0-关闭，1-开启',

  -- 隐私设置
  `show_online_status` TINYINT NOT NULL DEFAULT 1 COMMENT '显示在线状态：0-否，1-是',
  `allow_stranger_message` TINYINT NOT NULL DEFAULT 1 COMMENT '允许陌生人私信：0-否，1-是',
  `phone_search_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT '允许手机号搜索：0-否，1-是',
  `location_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '显示位置信息：0-否，1-是',

  -- 其他设置（JSON 格式，方便扩展）
  `extra_settings` JSON NULL COMMENT '其他扩展设置',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好设置表';

-- ----------------------------------------------------------------------------
-- 3.8 用户地址表 (user_address)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_address` (
  `address_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `contact_name` VARCHAR(50) NOT NULL COMMENT '联系人姓名',
  `contact_phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
  `province` VARCHAR(50) NOT NULL COMMENT '省份',
  `city` VARCHAR(50) NOT NULL COMMENT '城市',
  `district` VARCHAR(50) NOT NULL COMMENT '区/县',
  `detail_address` VARCHAR(200) NOT NULL COMMENT '详细地址',
  `postal_code` VARCHAR(10) NULL COMMENT '邮政编码',

  -- 标签和默认
  `tag` VARCHAR(20) NULL COMMENT '标签：家/公司/学校',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认地址：0-否，1-是',

  -- 地理坐标
  `longitude` DECIMAL(10, 7) NULL COMMENT '经度',
  `latitude` DECIMAL(10, 7) NULL COMMENT '纬度',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已删除',

  PRIMARY KEY (`address_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户地址表';

-- ----------------------------------------------------------------------------
-- 3.9 用户关注表 (user_follow)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_follow` (
  `follow_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关注ID',
  `follower_id` BIGINT NOT NULL COMMENT '关注者ID（主动关注的人）',
  `following_id` BIGINT NOT NULL COMMENT '被关注者ID（被关注的人）',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已取消关注',

  PRIMARY KEY (`follow_id`),
  UNIQUE KEY `uk_follow` (`follower_id`, `following_id`, `deleted`),
  KEY `idx_following_id` (`following_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注表';

-- ----------------------------------------------------------------------------
-- 3.10 用户黑名单表 (blacklist)
-- ----------------------------------------------------------------------------
CREATE TABLE `blacklist` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID（拉黑者）',
  `blocked_user_id` BIGINT NOT NULL COMMENT '被拉黑的用户ID',
  `reason` VARCHAR(255) NULL COMMENT '拉黑原因',

  -- 系统字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '拉黑时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已解除拉黑',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`, `deleted`),
  KEY `idx_blocked_user_id` (`blocked_user_id`)
) ENGINE=InnoDB;

-- ============================================================================
-- 第二部分：业务表结构（39张）
-- ============================================================================

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` bigint NOT NULL COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码(BCrypt加密)',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `is_active` tinyint DEFAULT '1' COMMENT '是否启用 0-禁用 1-启用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_login_log` (
  `id` bigint NOT NULL COMMENT '日志ID',
  `admin_id` bigint DEFAULT NULL COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `login_time` datetime NOT NULL COMMENT '登录时间',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `location` varchar(100) DEFAULT NULL COMMENT 'IP归属地',
  `browser` varchar(100) DEFAULT NULL COMMENT '浏览器',
  `os` varchar(100) DEFAULT NULL COMMENT '操作系统',
  `status` tinyint DEFAULT '1' COMMENT '登录状态 0-失败 1-成功',
  `message` varchar(255) DEFAULT NULL COMMENT '提示信息',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_admin_time` (`admin_id`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员登录日志表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_session` (
  `id` bigint NOT NULL COMMENT '会话ID',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `token` varchar(500) NOT NULL COMMENT 'JWT Token',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT 'User-Agent',
  `login_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `last_active_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-已退出 1-在线',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_token` (`token`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员在线会话表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `product_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `seller_id` bigint unsigned NOT NULL COMMENT '卖家ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å•†å“æ ‡é¢˜ï¼ˆè‰ç¨¿æ—¶å¯ç©ºï¼‰',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '商品描述',
  `category_id` int unsigned DEFAULT NULL COMMENT 'åˆ†ç±»IDï¼ˆè‰ç¨¿æ—¶å¯ä¸ºç©ºï¼‰',
  `price` decimal(10,2) unsigned DEFAULT NULL COMMENT 'ä»·æ ¼ï¼ˆå…ƒï¼‰',
  `original_price` decimal(10,2) unsigned DEFAULT NULL COMMENT '原价（元）',
  `condition_level` tinyint unsigned NOT NULL DEFAULT '9' COMMENT '成色：1-10，10为全新',
  `cover_image_id` bigint unsigned DEFAULT NULL COMMENT '封面图片ID',
  `image_count` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '图片数量',
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '交易地点',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `can_delivery` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'æ˜¯å¦æ”¯æŒé‚®å¯„ï¼š0-ä»…è‡ªæï¼Œ1-æ”¯æŒé‚®å¯„',
  `delivery_fee` decimal(10,2) unsigned DEFAULT NULL COMMENT 'é…é€è´¹ï¼ˆå…ƒï¼‰ï¼ŒNULLæˆ–0è¡¨ç¤ºåŒ…é‚®ï¼Œ>0è¡¨ç¤ºå…·ä½“è¿è´¹',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：0-下架 1-在售 2-已售 3-预订',
  `view_count` int unsigned NOT NULL DEFAULT '0' COMMENT '浏览次数',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  `audit_status` tinyint unsigned DEFAULT '0' COMMENT '审核状态：0-待审核，1-审核通过，2-审核拒绝',
  `audit_remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核意见',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `auditor_id` bigint unsigned DEFAULT NULL COMMENT '审核人ID',
  PRIMARY KEY (`product_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_price` (`price`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_location` (`location`(50)),
  FULLTEXT KEY `idx_title_desc` (`title`,`description`),
  CONSTRAINT `fk_product_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=289957090963888538 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_image` (
  `image_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '图片ID',
  `product_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `image_uuid` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å›¾ç‰‡UUIDï¼ˆç”¨äºŽç”Ÿæˆè®¿é—®URLï¼‰',
  `file_extension` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'æ–‡ä»¶æ‰©å±•åï¼ˆå¦‚: jpg, pngï¼‰',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '缩略图URL',
  `image_medium_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '中等尺寸图片URL',
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '排序顺序，数字越小越靠前',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小（字节）',
  `width` smallint unsigned DEFAULT NULL COMMENT '图片宽度',
  `height` smallint unsigned DEFAULT NULL COMMENT '图片高度',
  `is_cover` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否为封面：0-否 1-是',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '状态：0-正常 1-已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `idx_image_uuid` (`image_uuid`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_is_cover` (`is_cover`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_product_image_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=290028048819036044 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品图片表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_favorite` (
  `favorite_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `product_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `idx_user_product` (`user_id`,`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `fk_favorite_product` (`product_id`),
  CONSTRAINT `fk_favorite_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品收藏表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_view_history` (
  `history_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '历史ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `product_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `view_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
  `view_duration` int unsigned DEFAULT NULL COMMENT '浏览时长（秒）',
  PRIMARY KEY (`history_id`),
  KEY `idx_user_product_view` (`user_id`,`product_id`),
  KEY `idx_view_time` (`view_time`),
  KEY `fk_view_history_product` (`product_id`),
  CONSTRAINT `fk_view_history_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_view_history_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览历史表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_statistics` (
  `product_id` bigint NOT NULL COMMENT 'å•†å“ID',
  `view_count` int DEFAULT '0' COMMENT 'æµè§ˆæ¬¡æ•°',
  `favorite_count` int DEFAULT '0' COMMENT 'æ”¶è—æ¬¡æ•°',
  `image_count` int DEFAULT '0' COMMENT 'å›¾ç‰‡æ•°é‡',
  `cover_image_id` bigint DEFAULT NULL COMMENT 'å°é¢å›¾ç‰‡ID',
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å°é¢å›¾ç‰‡URL',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  PRIMARY KEY (`product_id`),
  KEY `idx_view_count` (`view_count`),
  KEY `idx_favorite_count` (`favorite_count`),
  KEY `idx_update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='å•†å“ç»Ÿè®¡è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_item` (
  `share_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '共享物品ID',
  `owner_id` bigint unsigned NOT NULL COMMENT '所有者ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '描述',
  `category_id` int unsigned DEFAULT NULL,
  `deposit` decimal(10,2) unsigned DEFAULT '0.00',
  `daily_rent` decimal(10,2) unsigned DEFAULT '0.00',
  `condition_level` tinyint unsigned DEFAULT NULL COMMENT '成色：1-10，10为全新',
  `cover_image_id` bigint unsigned DEFAULT NULL COMMENT '封面图片ID',
  `image_count` tinyint unsigned DEFAULT '0',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：0-下架 1-可借用 2-借用中',
  `available_times` json DEFAULT NULL COMMENT '可借用时间段，JSON格式',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`share_id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_share_item_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共享物品表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_item_image` (
  `image_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '图片ID',
  `share_id` bigint unsigned NOT NULL COMMENT '共享物品ID',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '缩略图URL',
  `image_medium_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '中等尺寸图片URL',
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小（字节）',
  `width` smallint unsigned DEFAULT NULL COMMENT '图片宽度',
  `height` smallint unsigned DEFAULT NULL COMMENT '图片高度',
  `is_cover` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否为封面：0-否 1-是',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '状态：0-正常 1-已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`image_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_is_cover` (`is_cover`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_share_item_image_share` FOREIGN KEY (`share_id`) REFERENCES `share_item` (`share_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共享物品图片表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_item_booking` (
  `booking_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'é¢„çº¦ID',
  `share_id` bigint NOT NULL COMMENT 'å…±äº«ç‰©å“ID',
  `owner_id` bigint NOT NULL COMMENT 'ç‰©å“æ‰€æœ‰è€…ID',
  `borrower_id` bigint NOT NULL COMMENT 'å€Ÿç”¨è€…ID',
  `start_date` date NOT NULL COMMENT 'é¢„çº¦å€Ÿç”¨å¼€å§‹æ—¥æœŸ',
  `end_date` date NOT NULL COMMENT 'é¢„çº¦å€Ÿç”¨ç»“æŸæ—¥æœŸ',
  `days` int NOT NULL COMMENT 'å€Ÿç”¨å¤©æ•°',
  `total_rent` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'æ€»ç§Ÿé‡‘ï¼ˆæ—¥ç§Ÿé‡‘Ã—å¤©æ•°ï¼‰',
  `deposit` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'æŠ¼é‡‘',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'æ€»é‡‘é¢ï¼ˆç§Ÿé‡‘+æŠ¼é‡‘ï¼‰',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT 'å€Ÿç”¨è¯´æ˜Ž/å¤‡æ³¨',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT 'é¢„çº¦çŠ¶æ€ï¼š0-å¾…å®¡æ‰¹ï¼Œ1-å·²æ‰¹å‡†ï¼Œ2-å·²æ‹’ç»ï¼Œ3-å·²å–æ¶ˆï¼Œ4-å€Ÿç”¨ä¸­ï¼Œ5-å·²å®Œæˆ',
  `start_time` datetime DEFAULT NULL COMMENT 'å¼€å§‹æ—¶é—´',
  `approve_time` datetime DEFAULT NULL COMMENT 'å®¡æ‰¹æ—¶é—´',
  `approve_remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å®¡æ‰¹å¤‡æ³¨',
  `return_time` datetime DEFAULT NULL COMMENT 'å®žé™…å½’è¿˜æ—¶é—´',
  `return_remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å½’è¿˜å¤‡æ³¨',
  `deposit_paid_time` datetime DEFAULT NULL COMMENT 'æŠ¼é‡‘æ”¯ä»˜æ—¶é—´',
  `deposit_returned` tinyint NOT NULL DEFAULT '0' COMMENT 'æ˜¯å¦å·²å½’è¿˜æŠ¼é‡‘ï¼š0-æœªé€€è¿˜ï¼Œ1-å·²é€€è¿˜',
  `deposit_return_time` datetime DEFAULT NULL COMMENT 'æŠ¼é‡‘é€€è¿˜æ—¶é—´',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'é€»è¾‘åˆ é™¤æ ‡è®°ï¼ˆ0=æœªåˆ é™¤ï¼Œ1=å·²åˆ é™¤ï¼‰',
  PRIMARY KEY (`booking_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_borrower_id` (`borrower_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='å…±äº«ç‰©å“é¢„çº¦å€Ÿç”¨è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'åˆ†ç±»ä»£ç ï¼ˆå¦‚ï¼šdigital, booksç­‰ï¼‰',
  `parent_id` int unsigned NOT NULL DEFAULT '0' COMMENT '父分类ID，0表示顶级分类',
  `icon` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类图标',
  `gradient` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'æ¸å˜è‰²èƒŒæ™¯CSS',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序，数字越小越靠前',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `idx_code` (`code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `buyer_id` bigint unsigned NOT NULL COMMENT '买家ID',
  `seller_id` bigint unsigned NOT NULL COMMENT '卖家ID',
  `product_id` bigint unsigned DEFAULT NULL COMMENT '商品ID',
  `share_id` bigint unsigned DEFAULT NULL COMMENT '共享物品ID',
  `type` tinyint unsigned NOT NULL COMMENT '类型：1-购买 2-共享',
  `order_type` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'è®¢å•ç±»åž‹ï¼š0-æ™®é€šè®¢å• 1-ç§’æ€è®¢å• 2-å…±äº«è®¢å• 3-æ‹å–è®¢å•',
  `amount` decimal(10,2) unsigned NOT NULL COMMENT '交易金额（元）',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '状态：0-待确认 1-进行中 2-已完成 3-已取消 4-退款中',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `ship_time` datetime DEFAULT NULL COMMENT '发货时间',
  `deliver_time` datetime DEFAULT NULL COMMENT '送达时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `finish_time` datetime DEFAULT NULL COMMENT '完成时间',
  `confirm_time` datetime DEFAULT NULL COMMENT '确认收货时间',
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '取消原因',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_order_type` (`order_type`) COMMENT 'æŒ‰è®¢å•ç±»åž‹æŸ¥è¯¢',
  KEY `idx_order_pay_time` (`pay_time`),
  KEY `idx_order_ship_time` (`ship_time`),
  KEY `idx_order_deliver_time` (`deliver_time`),
  CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_order_share` FOREIGN KEY (`share_id`) REFERENCES `share_item` (`share_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=289750524650199796 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation` (
  `eval_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` bigint unsigned NOT NULL COMMENT '订单ID',
  `from_user_id` bigint unsigned NOT NULL COMMENT '评价人ID',
  `to_user_id` bigint unsigned NOT NULL COMMENT '被评价人ID',
  `score` tinyint unsigned NOT NULL COMMENT '评分：1-5星',
  `content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '评价内容',
  `tags` json DEFAULT NULL COMMENT '标签，JSON数组：如["发货快","描述准确"]',
  `images` json DEFAULT NULL COMMENT '评价图片，JSON数组',
  `append_content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '追评内容',
  `append_images` json DEFAULT NULL COMMENT '追评图片，JSON数组',
  `append_time` datetime DEFAULT NULL COMMENT '追评时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`eval_id`),
  UNIQUE KEY `idx_order_id` (`order_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_score` (`score`),
  CONSTRAINT `fk_eval_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_eval_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eval_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=289770502883514083 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_record` (
  `refund_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'é€€æ¬¾è®°å½•ID',
  `refund_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'é€€æ¬¾å•å·',
  `order_id` bigint unsigned NOT NULL COMMENT 'è®¢å•ID',
  `refund_amount` decimal(10,2) unsigned NOT NULL COMMENT 'é€€æ¬¾é‡‘é¢',
  `refund_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'é€€æ¬¾åŽŸå› ',
  `refund_type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'é€€æ¬¾ç±»åž‹ï¼š1-ä»…é€€æ¬¾ 2-é€€è´§é€€æ¬¾',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'çŠ¶æ€ï¼š0-å¾…å®¡æ ¸ 1-å·²åŒæ„ 2-å·²æ‹’ç» 3-é€€è´§ä¸­ 4-å·²å®Œæˆ 5-å·²å–æ¶ˆ',
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'æ‹’ç»åŽŸå› ',
  `logistics_company` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ç‰©æµå…¬å¸',
  `logistics_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ç‰©æµå•å·',
  `logistics_time` datetime DEFAULT NULL COMMENT 'å‘è´§æ—¶é—´',
  `evidence_images` json DEFAULT NULL COMMENT 'é€€æ¬¾å‡­è¯å›¾ç‰‡ï¼ŒJSONæ•°ç»„',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'å¤‡æ³¨',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  `finish_time` datetime DEFAULT NULL COMMENT 'å®Œæˆæ—¶é—´',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'é€»è¾‘åˆ é™¤ï¼š0-æœªåˆ é™¤ 1-å·²åˆ é™¤',
  PRIMARY KEY (`refund_id`),
  UNIQUE KEY `idx_refund_no` (`refund_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_refund_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='é€€æ¬¾è®°å½•è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_record` (
  `transfer_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'è½¬èµ è®°å½•ID',
  `share_id` bigint NOT NULL COMMENT 'å…±äº«ç‰©å“ID',
  `from_user_id` bigint NOT NULL COMMENT 'è½¬å‡ºäººID',
  `to_user_id` bigint NOT NULL COMMENT 'æŽ¥æ”¶äººID',
  `transfer_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'è½¬èµ è¯´æ˜Ž',
  `accept_status` tinyint NOT NULL DEFAULT '0' COMMENT 'æŽ¥æ”¶äººç¡®è®¤çŠ¶æ€ï¼š0-å¾…ç¡®è®¤ï¼Œ1-å·²æŽ¥å—ï¼Œ2-å·²æ‹’ç»',
  `confirm_time` datetime DEFAULT NULL COMMENT 'ç¡®è®¤æ—¶é—´',
  `reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'æ‹’ç»åŽŸå› ',
  `complete_time` datetime DEFAULT NULL COMMENT 'è½¬èµ å®Œæˆæ—¶é—´',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'åˆ é™¤æ ‡è®°ï¼š0-æœªåˆ é™¤ï¼Œ1-å·²åˆ é™¤',
  PRIMARY KEY (`transfer_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_accept_status` (`accept_status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='è½¬èµ è®°å½•è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation` (
  `conversation_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `conversation_type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '会话类型：1-单聊 2-群聊',
  `user_id_1` bigint unsigned NOT NULL COMMENT '用户1ID（单聊时使用）',
  `user_id_2` bigint unsigned DEFAULT NULL COMMENT '用户2ID（单聊时使用）',
  `related_order_id` bigint unsigned DEFAULT NULL COMMENT '关联订单ID',
  `related_product_id` bigint unsigned DEFAULT NULL,
  `related_share_id` bigint unsigned DEFAULT NULL COMMENT '关联共享物品ID',
  `last_message_id` bigint unsigned DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_message_type` tinyint unsigned DEFAULT NULL COMMENT 'æœ€åŽä¸€æ¡æ¶ˆæ¯ç±»åž‹ï¼š1-æ–‡æœ¬ï¼Œ2-å›¾ç‰‡ï¼Œ3-å•†å“å¡ç‰‡ï¼Œ4-è®¢å•å¡ç‰‡ï¼Œ5-ç³»ç»Ÿé€šçŸ¥ï¼Œ6-å¼•ç”¨æ¶ˆæ¯',
  `last_message_time` datetime DEFAULT NULL COMMENT '最后消息时间',
  `unread_count_user1` int unsigned NOT NULL DEFAULT '0' COMMENT '用户1的未读消息数',
  `unread_count_user2` int unsigned NOT NULL DEFAULT '0' COMMENT '用户2的未读消息数',
  `is_muted_user1` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '用户1是否免打扰：0-否 1-是',
  `is_muted_user2` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '用户2是否免打扰：0-否 1-是',
  `remark_user1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户1对会话的备注名',
  `remark_user2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户2对会话的备注名',
  `is_archived_user1` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '用户1是否归档：0-否 1-是',
  `is_archived_user2` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '用户2是否归档：0-否 1-是',
  `is_pinned_user1` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'ç”¨æˆ·1æ˜¯å¦ç½®é¡¶ï¼š0-å¦ 1-æ˜¯',
  `is_pinned_user2` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'ç”¨æˆ·2æ˜¯å¦ç½®é¡¶ï¼š0-å¦ 1-æ˜¯',
  `pin_order_user1` int unsigned DEFAULT NULL COMMENT 'ç”¨æˆ·1çš„ç½®é¡¶æŽ’åºï¼ˆæ•°å€¼è¶Šå°è¶Šé å‰ï¼‰',
  `pin_order_user2` int unsigned DEFAULT NULL COMMENT 'ç”¨æˆ·2çš„ç½®é¡¶æŽ’åºï¼ˆæ•°å€¼è¶Šå°è¶Šé å‰ï¼‰',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'çŠ¶æ€ï¼š0-æ­£å¸¸ï¼Œ1-å·²åˆ é™¤',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`conversation_id`),
  KEY `idx_user_id_1` (`user_id_1`),
  KEY `idx_user_id_2` (`user_id_2`),
  KEY `idx_last_message_time` (`last_message_time`),
  KEY `idx_related_order_id` (`related_order_id`),
  KEY `idx_pinned_user1` (`is_pinned_user1`,`pin_order_user1`),
  KEY `idx_pinned_user2` (`is_pinned_user2`,`pin_order_user2`),
  KEY `idx_related_product_id` (`related_product_id`),
  KEY `idx_related_share_id` (`related_share_id`),
  KEY `idx_last_message_type` (`last_message_type`),
  CONSTRAINT `fk_conversation_order` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_share` FOREIGN KEY (`related_share_id`) REFERENCES `share_item` (`share_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_user1` FOREIGN KEY (`user_id_1`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_conversation_user2` FOREIGN KEY (`user_id_2`) REFERENCES `user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=289764955505432336 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_member` (
  `member_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '群昵称',
  `unread_count` int unsigned NOT NULL DEFAULT '0' COMMENT '未读消息数',
  `is_muted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否免打扰：0-否 1-是',
  `join_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_read_message_id` bigint unsigned DEFAULT NULL COMMENT '最后阅读的消息ID',
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `idx_conversation_user` (`conversation_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_conversation_member_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `from_user_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `to_user_id` bigint unsigned DEFAULT NULL COMMENT '接收者ID（单聊时使用）',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '消息内容',
  `type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '类型：1-文本 2-图片 3-商品卡片 4-订单卡片 5-系统通知 6-引用消息',
  `parent_message_id` bigint unsigned DEFAULT NULL COMMENT '引用的父消息ID',
  `is_read` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否已读：0-未读 1-已读',
  `read_time` datetime DEFAULT NULL COMMENT '阅读时间',
  `send_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '发送状态：0-发送中 1-成功 2-失败',
  `delivered_time` datetime DEFAULT NULL COMMENT '送达时间',
  `extra_data` json DEFAULT NULL COMMENT '扩展数据，存储卡片详细信息',
  `reply_count` int unsigned NOT NULL DEFAULT '0' COMMENT '被回复次数',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '状态：0-正常 1-撤回 2-删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_parent_message_id` (`parent_message_id`),
  KEY `fk_message_to_user` (`to_user_id`),
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_message_parent` FOREIGN KEY (`parent_message_id`) REFERENCES `message` (`message_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_message_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=289999912630882990 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quick_reply` (
  `reply_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '回复ID',
  `user_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '用户ID，0表示系统预设',
  `content` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '回复内容',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类：交易-询问/交易-确认/其他',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_system` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否系统预设：0-否 1-是',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`reply_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快捷回复模板表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banner` (
  `banner_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '轮播图ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '轮播图标题',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `image_thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '缩略图URL',
  `link_type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '链接类型：1-无 2-外链 3-商品详情 4-功能页面',
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '跳转URL（外链时使用）',
  `link_product_id` bigint unsigned DEFAULT NULL COMMENT '关联商品ID（link_type=3时使用）',
  `link_page_path` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '功能页面路径（link_type=4时使用）',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序，数字越小越靠前',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `start_time` datetime DEFAULT NULL COMMENT '开始展示时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束展示时间',
  `click_count` int unsigned NOT NULL DEFAULT '0' COMMENT '点击次数',
  `exposure_count` int unsigned NOT NULL DEFAULT '0' COMMENT '曝光次数',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`banner_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_start_end_time` (`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon` (
  `coupon_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ä¼˜æƒ åˆ¸ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ä¼˜æƒ åˆ¸åç§°',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ä¼˜æƒ åˆ¸æè¿°',
  `type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'ä¼˜æƒ åˆ¸ç±»åž‹ï¼š1-æ»¡å‡åˆ¸ï¼Œ2-æŠ˜æ‰£åˆ¸ï¼Œ3-å…é‚®åˆ¸',
  `min_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'é—¨æ§›é‡‘é¢ï¼ˆæ»¡å¤šå°‘å¯ç”¨ï¼‰',
  `discount_value` decimal(10,2) NOT NULL COMMENT 'ä¼˜æƒ é‡‘é¢/æŠ˜æ‰£å€¼',
  `max_discount` decimal(10,2) DEFAULT NULL COMMENT 'æœ€å¤§ä¼˜æƒ é‡‘é¢ï¼ˆæŠ˜æ‰£åˆ¸ç”¨ï¼‰',
  `total_count` int unsigned NOT NULL DEFAULT '0' COMMENT 'æ€»å‘è¡Œæ•°é‡',
  `received_count` int unsigned NOT NULL DEFAULT '0' COMMENT 'å·²é¢†å–æ•°é‡',
  `used_count` int unsigned NOT NULL DEFAULT '0' COMMENT 'å·²ä½¿ç”¨æ•°é‡',
  `limit_per_user` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'æ¯äººé™é¢†æ•°é‡',
  `scope` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'ä½¿ç”¨èŒƒå›´ï¼š1-å…¨åœºï¼Œ2-æŒ‡å®šåˆ†ç±»ï¼Œ3-æŒ‡å®šå•†å“',
  `category_ids` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'é€‚ç”¨åˆ†ç±»IDï¼ˆJSONæ•°ç»„ï¼‰',
  `product_ids` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'é€‚ç”¨å•†å“IDï¼ˆJSONæ•°ç»„ï¼‰',
  `valid_from` datetime NOT NULL COMMENT 'æœ‰æ•ˆå¼€å§‹æ—¶é—´',
  `valid_to` datetime NOT NULL COMMENT 'æœ‰æ•ˆç»“æŸæ—¶é—´',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ä¼˜æƒ åˆ¸å›¾ç‰‡',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'çŠ¶æ€ï¼š0-è‰ç¨¿ï¼Œ1-è¿›è¡Œä¸­ï¼Œ2-å·²ç»“æŸï¼Œ3-å·²ä½œåºŸ',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT 'æŽ’åº',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'åˆ é™¤æ ‡è®°ï¼š0-æ­£å¸¸ 1-å·²åˆ é™¤',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  PRIMARY KEY (`coupon_id`),
  KEY `idx_status` (`status`),
  KEY `idx_valid_time` (`valid_from`,`valid_to`),
  KEY `idx_sort` (`sort_order` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ä¼˜æƒ åˆ¸è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_product` (
  `id` bigint unsigned NOT NULL COMMENT '秒杀商品ID',
  `session_id` bigint unsigned DEFAULT NULL COMMENT '场次ID',
  `product_id` bigint unsigned NOT NULL COMMENT 'å•†å“ID',
  `flash_price` decimal(10,2) NOT NULL COMMENT 'ç§’æ€ä»·æ ¼',
  `stock_count` int unsigned NOT NULL DEFAULT '1' COMMENT 'ç§’æ€åº“å­˜æ•°é‡ï¼ˆäºŒæ‰‹å•†å“é€šå¸¸ä¸º1ï¼‰',
  `sold_count` int unsigned NOT NULL DEFAULT '0' COMMENT 'å·²å”®æ•°é‡',
  `limit_per_user` int unsigned DEFAULT '1' COMMENT '每人限购数量',
  `repeat_type` tinyint DEFAULT '1' COMMENT '重复类型：0-不重复（卖完下架），1-每日重复',
  `sale_date` date DEFAULT NULL COMMENT '参与秒杀的日期（NULL表示每日重复，有值表示指定日期）',
  `stock_status` tinyint DEFAULT '0' COMMENT '库存状态：0-在售，1-已售罄，2-手动下架',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT 'æŽ’åºæƒé‡',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'åˆ é™¤æ ‡è®°ï¼š0-æ­£å¸¸ 1-å·²åˆ é™¤',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_sort` (`sort_order` DESC),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ç§’æ€å•†å“è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_session` (
  `session_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'åœºæ¬¡ID',
  `name` varchar(100) DEFAULT NULL COMMENT '场次名称',
  `description` varchar(500) DEFAULT NULL COMMENT '场次描述',
  `session_time` varchar(10) DEFAULT NULL COMMENT '场次时间点（HH:mm格式）',
  `start_time` datetime NOT NULL COMMENT 'å®žé™…å¼€å§‹æ—¶é—´',
  `end_time` datetime NOT NULL COMMENT 'å®žé™…ç»“æŸæ—¶é—´',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT 'æŽ’åº',
  `session_type` tinyint DEFAULT '1' COMMENT '场次类型：1-默认固定场次，2-特殊临时场次',
  `enabled` tinyint DEFAULT '1' COMMENT '是否启用：0-禁用（暂停/取消），1-启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_status_time` (`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=289300035559100484 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç§’æ€åœºæ¬¡è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_session_template` (
  `template_id` int NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` varchar(100) NOT NULL COMMENT '场次名称',
  `session_time` varchar(10) NOT NULL COMMENT '时间点 HH:mm',
  `duration_hours` int NOT NULL DEFAULT '2' COMMENT '持续小时数',
  `sort_order` int NOT NULL COMMENT '排序权重',
  `is_enabled` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用：0-禁用，1-启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`template_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='秒杀场次模板表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_order_ext` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ä¸»é”®ID',
  `order_id` bigint unsigned NOT NULL COMMENT 'è®¢å•IDï¼ˆå…³è”orderè¡¨ï¼‰',
  `user_id` bigint unsigned NOT NULL COMMENT 'ç”¨æˆ·IDï¼ˆå†—ä½™å­—æ®µï¼Œæ–¹ä¾¿æŸ¥è¯¢ï¼‰',
  `product_id` bigint unsigned NOT NULL COMMENT 'å•†å“IDï¼ˆå†—ä½™å­—æ®µï¼Œæ–¹ä¾¿æŸ¥è¯¢ï¼‰',
  `session_id` bigint unsigned DEFAULT NULL COMMENT 'ç§’æ€åœºæ¬¡ID',
  `flash_price` decimal(10,2) NOT NULL COMMENT 'ç§’æ€æˆäº¤ä»·',
  `discount` decimal(3,1) DEFAULT NULL COMMENT 'æŠ˜æ‰£ï¼ˆå¦‚8.5è¡¨ç¤º8.5æŠ˜ï¼‰',
  `seckill_time` datetime NOT NULL COMMENT 'æŠ¢è´­æ—¶é—´',
  `client_ip` varchar(50) DEFAULT NULL COMMENT 'å®¢æˆ·ç«¯IPï¼ˆé˜²åˆ·å•ï¼‰',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_id` (`order_id`) COMMENT 'ä¸€ä¸ªè®¢å•åªèƒ½æœ‰ä¸€æ¡ç§’æ€è®°å½•',
  KEY `idx_user_activity` (`user_id`) COMMENT 'æŸ¥è¯¢ç”¨æˆ·åœ¨æŸæ´»åŠ¨çš„è´­ä¹°è®°å½•',
  KEY `idx_user_session` (`user_id`,`session_id`) COMMENT 'æŸ¥è¯¢ç”¨æˆ·åœ¨åœºæ¬¡çš„è´­ä¹°è®°å½•',
  KEY `idx_activity_time` (`seckill_time`) COMMENT 'æ´»åŠ¨è®¢å•æŒ‰æ—¶é—´æŽ’åº',
  KEY `idx_user_product` (`user_id`,`product_id`) COMMENT 'æŸ¥è¯¢ç”¨æˆ·è´­ä¹°æŸå•†å“è®°å½•',
  KEY `idx_client_ip` (`client_ip`) COMMENT 'é˜²åˆ·å•æŸ¥è¯¢'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç§’æ€è®¢å•æ‰©å±•è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hot_tag` (
  `id` bigint NOT NULL COMMENT '标签ID',
  `keyword` varchar(50) NOT NULL COMMENT '搜索关键词',
  `click_count` int DEFAULT '0' COMMENT '点击次数',
  `sort_order` int DEFAULT '0' COMMENT '排序值（越小越靠前）',
  `is_active` tinyint DEFAULT '1' COMMENT '是否启用：0-禁用 1-启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '删除标记：0-正常 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='热门搜索标签表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `config_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键（唯一）',
  `config_value` text COLLATE utf8mb4_unicode_ci COMMENT '配置值',
  `config_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string' COMMENT '配置类型：string/number/boolean/json',
  `value_options` json DEFAULT NULL COMMENT '可选值列表，JSON格式',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置说明',
  `group_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分组名称：basic/upload/payment/email/sms等',
  `is_public` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否公开：0-否 1-是（公开的配置前端可访问）',
  `is_system` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否系统配置：0-否 1-是（系统配置不可删除）',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `idx_config_key` (`config_key`),
  KEY `idx_group_name` (`group_name`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_notification` (
  `notification_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '通知内容，支持富文本',
  `type` tinyint unsigned NOT NULL COMMENT '通知类型：1-系统公告 2-活动通知 3-账户提醒 4-交易提醒',
  `target_type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '目标类型：1-全部用户 2-指定用户 3-指定等级',
  `target_users` json DEFAULT NULL COMMENT '指定用户ID列表，JSON数组',
  `target_level` int unsigned DEFAULT NULL COMMENT '目标用户等级',
  `is_read` json DEFAULT NULL COMMENT '已读用户ID列表，JSON数组',
  `link_type` tinyint unsigned DEFAULT NULL COMMENT '跳转链接类型：1-无 2-网页 3-商品详情 4-订单详情',
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '跳转URL',
  `link_product_id` bigint unsigned DEFAULT NULL COMMENT '关联商品ID',
  `link_order_id` bigint unsigned DEFAULT NULL COMMENT '关联订单ID',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `end_time` datetime DEFAULT NULL COMMENT 'ç»“æŸå±•ç¤ºæ—¶é—´ï¼ˆå¯é€‰ï¼‰',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '状态：0-草稿 1-已发布 2-已撤回',
  `priority` tinyint unsigned NOT NULL DEFAULT '2' COMMENT '优先级：1-低 2-中 3-高',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`notification_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_read_records` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'è®°å½•ID',
  `notification_id` bigint NOT NULL COMMENT 'é€šçŸ¥ID',
  `user_id` bigint NOT NULL COMMENT 'ç”¨æˆ·ID',
  `read_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'é˜…è¯»æ—¶é—´',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_user` (`notification_id`,`user_id`),
  KEY `idx_notification` (`notification_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read_time` (`read_time`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='é€šçŸ¥é˜…è¯»è®°å½•è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation_log` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'æ—¥å¿—ID',
  `user_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT 'æ“ä½œç”¨æˆ·IDï¼Œ0è¡¨ç¤ºç³»ç»Ÿæ“ä½œ',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ç”¨æˆ·åï¼ˆå†—ä½™å­—æ®µï¼‰',
  `biz_id` bigint unsigned DEFAULT NULL COMMENT 'ä¸šåŠ¡å¯¹è±¡IDï¼ˆå¦‚è®¢å•IDã€å•†å“IDç­‰ï¼‰',
  `biz_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ä¸šåŠ¡å¯¹è±¡ç±»åž‹ï¼ˆå¦‚orderã€productç­‰ï¼‰',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'æ“ä½œæ¨¡å—ï¼šuser/product/order/share_item/systemç­‰',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'æ“ä½œç±»åž‹ï¼šlogin/create/update/delete/query/exportç­‰',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'æ“ä½œæè¿°',
  `request_method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'è¯·æ±‚æ–¹æ³•ï¼šGET/POST/PUT/DELETE',
  `request_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'è¯·æ±‚URL',
  `request_params` json DEFAULT NULL COMMENT 'è¯·æ±‚å‚æ•°ï¼ŒJSONæ ¼å¼',
  `response_result` json DEFAULT NULL COMMENT 'å“åº”ç»“æžœï¼ŒJSONæ ¼å¼',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IPåœ°å€',
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ç”¨æˆ·ä»£ç†',
  `execute_time` bigint unsigned DEFAULT NULL COMMENT 'æ‰§è¡Œæ—¶é•¿ï¼ˆæ¯«ç§’ï¼‰',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'æ‰§è¡ŒçŠ¶æ€ï¼š1-æˆåŠŸ 0-å¤±è´¥',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'é”™è¯¯ä¿¡æ¯ï¼ˆå¤±è´¥æ—¶è®°å½•ï¼‰',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'æ“ä½œæ—¶é—´',
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_action` (`action`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_biz_id` (`biz_id`),
  KEY `idx_biz_type` (`biz_type`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='æ“ä½œæ—¥å¿—è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `error_log` (
  `id` bigint NOT NULL COMMENT '异常ID',
  `level` varchar(10) NOT NULL COMMENT '异常级别：ERROR/WARN/INFO',
  `message` text NOT NULL COMMENT '异常信息',
  `exception_type` varchar(100) DEFAULT NULL COMMENT '异常类型',
  `stack_trace` text COMMENT '堆栈跟踪',
  `request_url` varchar(500) DEFAULT NULL COMMENT '请求URL',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `request_params` text COMMENT '请求参数',
  `user_id` bigint DEFAULT NULL COMMENT '操作用户ID',
  `user_type` tinyint DEFAULT NULL COMMENT '用户类型：1-普通用户 2-管理员',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `occur_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '发生时间',
  PRIMARY KEY (`id`),
  KEY `idx_level` (`level`),
  KEY `idx_occur_time` (`occur_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统异常日志表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_log` (
  `id` bigint NOT NULL COMMENT '导出ID',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `admin_name` varchar(50) NOT NULL COMMENT '管理员用户名',
  `report_type` varchar(50) NOT NULL COMMENT '报表类型: user/order/product',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `row_count` int NOT NULL COMMENT '数据行数',
  `file_size` bigint NOT NULL COMMENT '文件大小(字节)',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `duration` bigint DEFAULT NULL COMMENT '导出耗时(毫秒)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_admin_type_time` (`admin_id`,`report_type`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据导出记录表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `reporter_id` bigint unsigned NOT NULL COMMENT '举报人ID',
  `reported_user_id` bigint unsigned NOT NULL COMMENT '被举报人ID',
  `conversation_id` bigint unsigned DEFAULT NULL COMMENT '会话ID',
  `message_id` bigint unsigned DEFAULT NULL COMMENT '消息ID',
  `reason` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报原因：欺诈/骚扰/虚假信息/其他',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '描述',
  `evidence_images` json DEFAULT NULL COMMENT '证据图片，JSON数组',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '处理状态：0-待处理 1-已处理 2-已驳回',
  `admin_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '管理员备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
  PRIMARY KEY (`report_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_reported_user_id` (`reported_user_id`),
  KEY `idx_status` (`status`),
  KEY `fk_report_conversation` (`conversation_id`),
  KEY `fk_report_message` (`message_id`),
  CONSTRAINT `fk_report_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_message` FOREIGN KEY (`message_id`) REFERENCES `message` (`message_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_reported_user` FOREIGN KEY (`reported_user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报记录表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_feedback` (
  `feedback_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '反馈ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID（可为空，匿名反馈）',
  `contact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系方式（手机/邮箱）',
  `type` tinyint unsigned NOT NULL COMMENT '反馈类型：1-功能建议 2-Bug反馈 3-投诉 4-其他',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈内容',
  `images` json DEFAULT NULL COMMENT '图片列表，JSON数组',
  `status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '处理状态：0-待处理 1-处理中 2-已处理 3-已驳回',
  `handler_id` bigint unsigned DEFAULT NULL COMMENT '处理人ID（管理员）',
  `handle_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '处理备注',
  `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`feedback_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensitive_word` (
  `word_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '敏感词ID',
  `word` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '敏感词',
  `type` tinyint unsigned NOT NULL COMMENT '类型：1-禁止词 2-敏感词 3-替换词',
  `replace_word` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '替换词（type=3时使用）',
  `level` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '等级：1-一般 2-严重（严重等级直接拦截）',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`word_id`),
  UNIQUE KEY `idx_word` (`word`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statistics_cache` (
  `id` bigint NOT NULL COMMENT '缓存ID',
  `cache_key` varchar(100) NOT NULL COMMENT '缓存键',
  `cache_data` json NOT NULL COMMENT '缓存数据',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cache_key` (`cache_key`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据统计缓存表';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campus_location` (
  `location_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ä½ç½®ID',
  `name` varchar(50) NOT NULL COMMENT 'ä½ç½®åç§°',
  `code` varchar(50) NOT NULL COMMENT 'ä½ç½®ä»£ç ',
  `description` varchar(200) DEFAULT NULL COMMENT 'ä½ç½®æè¿°',
  `sort_order` int DEFAULT '0' COMMENT 'æŽ’åº',
  `status` tinyint DEFAULT '1' COMMENT 'çŠ¶æ€ï¼š0-ç¦ç”¨ï¼Œ1-å¯ç”¨',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  `deleted` tinyint DEFAULT '0' COMMENT 'é€»è¾‘åˆ é™¤æ ‡è®°ï¼ˆ0=æœªåˆ é™¤ï¼Œ1=å·²åˆ é™¤ï¼‰',
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='æ ¡å›­ä½ç½®è¡¨';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker_node` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `host_name` varchar(64) NOT NULL COMMENT '主机名',
  `port` varchar(64) NOT NULL COMMENT '端口',
  `type` int NOT NULL COMMENT '节点类型: ACTUAL(1) CONTAINER(2)',
  `launch_date` date NOT NULL COMMENT '上线日期',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_host_port` (`host_name`,`port`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='DB WorkerID分配';

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_history` (
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


SET FOREIGN_KEY_CHECKS = 1;

SELECT '=============================' AS '';
SELECT '✅ 数据库表结构创建完成！' AS '状态';
SELECT '📊 共创建 50 张表' AS '统计';
SELECT '=============================' AS '';

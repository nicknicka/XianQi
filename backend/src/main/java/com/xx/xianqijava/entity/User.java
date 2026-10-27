package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user")
@Schema(description = "用户")
public class User extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 逻辑删除标记（0=未删除，1=已删除）
     */
    @TableLogic
    private Integer deleted;

    @TableId(type = IdType.ASSIGN_ID)
    @Schema(description = "用户ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "密码（加密）")
    private String password;

    @Schema(description = "支付密码（加密）")
    private String payPassword;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "头像")
    private String avatar;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "学号")
    private String studentId;

    @Schema(description = "真实姓名")
    private String realName;

    @Schema(description = "学院")
    private String college;

    @Schema(description = "专业")
    private String major;

    @Schema(description = "信用分数")
    private Integer creditScore;

    @Schema(description = "状态：0-正常，1-封禁")
    private Integer status;

    @Schema(description = "是否实名认证：0-否，1-是")
    private Integer isVerified;

    @Schema(description = "允许手机号搜索：0-否，1-是")
    private Integer phoneSearchEnabled;

    @Schema(description = "显示位置信息：0-否，1-是")
    private Integer locationEnabled;

    @Schema(description = "微信OpenID")
    private String wechatOpenid;

    @Schema(description = "微信UnionID")
    private String wechatUnionid;

    @Schema(description = "QQ OpenID")
    private String qqOpenid;

    @Schema(description = "最后登录时间")
    private java.time.LocalDateTime lastLoginTime;

    @Schema(description = "主题：light-浅色，dark-深色，auto-跟随系统")
    private String theme;

    @Schema(description = "自动深色模式：0-关闭，1-开启")
    private Integer autoDarkMode;

    @Schema(description = "字体大小（px）")
    private Integer fontSize;

    @Schema(description = "设备类型")
    private String deviceType;

    @Schema(description = "语言")
    private String language;

    @Schema(description = "是否启用通知：0-关闭，1-开启")
    private Integer notificationEnabled;

    @Schema(description = "是否启用提示音：0-关闭，1-开启")
    private Integer soundEnabled;

    @Schema(description = "是否启用振动：0-关闭，1-开启")
    private Integer vibrationEnabled;

    @Schema(description = "性别：0-未知，1-男，2-女")
    private Integer gender;

    @Schema(description = "生日")
    private java.time.LocalDate birthday;

    @Schema(description = "个人简介")
    private String bio;

    @TableField("location")
    @Schema(description = "位置展示（如：北京市海淀区）")
    private String locationDisplay;

    @Schema(description = "个人主页")
    private String homepage;

    @Schema(description = "个人标签（JSON数组）")
    private String tags;

    @Schema(description = "粉丝数")
    private Integer followersCount;

    @Schema(description = "关注数")
    private Integer followingCount;

    @Schema(description = "发布商品数")
    private Integer productsCount;

    @Schema(description = "收藏数")
    private Integer favoritesCount;

    @Schema(description = "信用等级")
    private String creditLevel;

    @Schema(description = "最后活跃时间")
    private java.time.LocalDateTime lastActiveTime;

    @Schema(description = "上次信用分衰减时间")
    private java.time.LocalDateTime lastCreditDecayTime;

    @Schema(description = "好评总数")
    private Integer totalPositiveEvaluations;

    @Schema(description = "中评总数")
    private Integer totalNeutralEvaluations;

    @Schema(description = "差评总数")
    private Integer totalNegativeEvaluations;

    @Schema(description = "芝麻信用分")
    private Integer zhimaCreditScore;

    @Schema(description = "芝麻信用授权时间")
    private java.time.LocalDateTime zhimaAuthTime;
}

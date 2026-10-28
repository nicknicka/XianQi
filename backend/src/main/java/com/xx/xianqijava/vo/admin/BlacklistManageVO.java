package com.xx.xianqijava.vo.admin;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 管理后台黑名单记录视图对象。
 *
 * <p>管理端列表与详情不直接返回 {@code Blacklist} 实体：实体只含双方用户 ID，
 * 无法支撑管理界面展示「谁拉黑了谁」。本对象在实体字段基础上补充双方昵称与手机号，
 * 由服务层从用户表查出后填充。
 */
@Data
@Schema(description = "黑名单记录（管理端）")
public class BlacklistManageVO {

    @Schema(description = "黑名单记录ID")
    private String blacklistId;

    @Schema(description = "拉黑发起人ID")
    private String userId;

    @Schema(description = "拉黑发起人昵称")
    private String userNickname;

    @Schema(description = "拉黑发起人手机号")
    private String userPhone;

    @Schema(description = "被拉黑用户ID")
    private String blockedUserId;

    @Schema(description = "被拉黑用户昵称")
    private String blockedUserNickname;

    @Schema(description = "被拉黑用户手机号")
    private String blockedUserPhone;

    @Schema(description = "拉黑原因")
    private String reason;

    @Schema(description = "创建时间")
    private java.time.LocalDateTime createdAt;
}

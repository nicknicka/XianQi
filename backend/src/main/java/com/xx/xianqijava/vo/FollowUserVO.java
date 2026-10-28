package com.xx.xianqijava.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 关注/粉丝列表中的用户视图对象。
 *
 * <p>与 {@link UserInfoVO} 的区别：本对象用于「关注关系」列表，额外携带
 * {@code followTime}（该条关注关系建立的时间）。不复用 {@code UserInfoVO.createdAt}
 * 承载关注时间，避免同一字段名在不同接口表示不同语义。
 */
@Data
@Schema(description = "关注列表用户信息")
public class FollowUserVO {

    @Schema(description = "用户ID")
    private Long id;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "头像")
    private String avatar;

    @Schema(description = "学院")
    private String college;

    @Schema(description = "专业")
    private String major;

    @Schema(description = "信用分")
    private Integer creditScore;

    @Schema(description = "是否已认证")
    private Integer isVerified;

    @Schema(description = "关注时间（该条关注关系建立的时间）")
    private String followTime;
}

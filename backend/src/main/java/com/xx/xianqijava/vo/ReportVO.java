package com.xx.xianqijava.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 举报视图对象
 */
@Data
@Schema(description = "举报记录")
public class ReportVO {

    @Schema(description = "举报ID")
    private String reportId;

    @Schema(description = "举报人ID")
    private String reporterId;

    @Schema(description = "举报人昵称")
    private String reporterNickname;

    @Schema(description = "举报人头像")
    private String reporterAvatar;

    @Schema(description = "举报对象类型：user/product/message/conversation")
    private String targetType;

    @Schema(description = "举报对象ID")
    private String targetId;

    @Schema(description = "被举报人ID（仅当举报对象为用户时）")
    private String reportedUserId;

    @Schema(description = "被举报人昵称（仅当举报对象为用户时）")
    private String reportedUserNickname;

    @Schema(description = "被举报人头像（仅当举报对象为用户时）")
    private String reportedUserAvatar;

    @Schema(description = "举报原因")
    private String reason;

    @Schema(description = "描述")
    private String description;

    @Schema(description = "证据图片")
    private String evidenceImages;

    @Schema(description = "举报类型：0-其他 1-欺诈 2-色情 3-暴力 4-垃圾信息")
    private Integer type;

    @Schema(description = "处理状态：0-待处理，1-已处理，2-已驳回")
    private Integer status;

    @Schema(description = "状态描述")
    private String statusDesc;

    @Schema(description = "处理管理员ID")
    private String handlerId;

    @Schema(description = "处理备注")
    private String handleNote;

    @Schema(description = "处理备注，兼容字段")
    private String adminNote;

    @Schema(description = "处理时间")
    private LocalDateTime handleTime;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;
}

package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 举报记录表
 *
 * <p>举报对象使用多态引用：{@code targetType} 描述对象类别（user / product /
 * message / conversation），{@code targetId} 指向该对象的 ID。
 */
@Data
@TableName("report")
@Schema(description = "举报记录")
public class Report {

    @TableId(value = "report_id", type = IdType.ASSIGN_ID)
    @Schema(description = "举报ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long reportId;

    @Schema(description = "举报人ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long reporterId;

    @Schema(description = "举报对象类型：user/product/message/conversation")
    private String targetType;

    @Schema(description = "举报对象ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long targetId;

    @Schema(description = "举报原因：欺诈/骚扰/虚假信息/其他")
    private String reason;

    @Schema(description = "描述")
    private String description;

    @Schema(description = "证据图片（JSON数组）")
    private String evidenceImages;

    @Schema(description = "举报类型：0-其他 1-欺诈 2-色情 3-暴力 4-垃圾信息")
    private Integer type;

    @Schema(description = "处理状态：0-待处理，1-已处理，2-已驳回")
    private Integer status;

    @Schema(description = "处理管理员ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long handlerId;

    @Schema(description = "处理备注")
    private String handleNote;

    @Schema(description = "处理时间")
    private LocalDateTime handleTime;

    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}

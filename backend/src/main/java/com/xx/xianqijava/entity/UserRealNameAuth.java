package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实名认证表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_real_name_auth")
@Schema(description = "用户实名认证")
public class UserRealNameAuth extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    @Schema(description = "主键ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Schema(description = "用户ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    @Schema(description = "真实姓名")
    private String realName;

    @Schema(description = "身份证号（加密）")
    private String idCard;

    @Schema(description = "认证状态：0-未认证 1-审核中 2-已认证 3-认证失败")
    private Integer status;

    @Schema(description = "认证失败原因")
    private String rejectReason;

    @Schema(description = "审核人ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long auditedBy;

    @Schema(description = "审核时间")
    private LocalDateTime auditedAt;

}

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
 * 订单操作日志表。
 *
 * <p>记录买家/卖家对订单的业务操作，与管理员审计日志（{@link OperationLog}）分离。
 * {@code operatorId} 指向具体用户，弥补 operation_log 只能存用户名字符串的缺口。
 */
@Data
@TableName("order_log")
@Schema(description = "订单操作日志")
public class OrderLog {

    @TableId(value = "order_log_id", type = IdType.ASSIGN_ID)
    @Schema(description = "订单日志ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderLogId;

    @Schema(description = "订单ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderId;

    @Schema(description = "操作人用户ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long operatorId;

    @Schema(description = "操作人昵称（冗余，便于展示）")
    private String operatorName;

    @Schema(description = "操作类型：create/confirm/cancel/complete/refund_request/refund_approve/refund_reject")
    private String action;

    @Schema(description = "操作描述")
    private String detail;

    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}

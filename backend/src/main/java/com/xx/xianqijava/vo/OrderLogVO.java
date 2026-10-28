package com.xx.xianqijava.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 订单操作日志视图对象。
 *
 * <p>字段命名保持与旧 {@code OperationLogVO} 订单视图一致（{@code logId}、
 * {@code username}、{@code actionText}、{@code createdAt}），
 * 让移动端订单详情页无需改动即可继续展示（移动端自行把 {@code username} 映射为 {@code userName}）。
 */
@Data
@Schema(description = "订单操作日志")
public class OrderLogVO {

    @Schema(description = "日志ID")
    private String logId;

    @Schema(description = "日志ID，兼容字段")
    private String id;

    @Schema(description = "订单ID")
    private String orderId;

    @Schema(description = "操作人用户ID")
    private String userId;

    @Schema(description = "操作人昵称")
    private String username;

    @Schema(description = "操作类型（英文 code）")
    private String action;

    @Schema(description = "操作文案（中文展示）")
    private String actionText;

    @Schema(description = "操作描述")
    private String description;

    @Schema(description = "操作时间")
    private String createdAt;
}

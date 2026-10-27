package com.xx.xianqijava.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 创建举报DTO
 *
 * <p>举报对象使用多态引用：{@code targetType} 描述对象类别，{@code targetId} 指向该对象 ID。
 */
@Data
@Schema(description = "创建举报请求")
public class ReportCreateDTO {

    @NotNull(message = "举报对象类型不能为空")
    @Pattern(regexp = "user|product|message|conversation", message = "举报对象类型不合法")
    @Schema(description = "举报对象类型：user/product/message/conversation")
    private String targetType;

    @NotNull(message = "举报对象ID不能为空")
    @Schema(description = "举报对象ID")
    private String targetId;

    @NotBlank(message = "举报原因不能为空")
    @Schema(description = "举报原因：欺诈/骚扰/虚假信息/其他")
    private String reason;

    @Schema(description = "详细描述")
    private String description;

    @Schema(description = "证据图片URL列表（JSON数组）")
    private String evidenceImages;

    @Schema(description = "举报类型：0-其他 1-欺诈 2-色情 3-暴力 4-垃圾信息")
    private Integer type;
}

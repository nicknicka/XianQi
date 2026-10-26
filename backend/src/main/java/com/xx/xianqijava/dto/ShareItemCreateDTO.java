package com.xx.xianqijava.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 创建共享物品DTO
 */
@Data
@Schema(description = "创建共享物品请求")
public class ShareItemCreateDTO {

    @NotBlank(message = "物品标题不能为空")
    @Schema(description = "物品标题")
    private String title;

    @Schema(description = "描述")
    private String description;

    @NotNull(message = "分类ID不能为空")
    @Schema(description = "分类ID")
    private String categoryId;

    @NotNull(message = "押金不能为空")
    @Schema(description = "押金")
    private BigDecimal deposit;

    @NotNull(message = "日租金不能为空")
    @Schema(description = "日租金")
    private BigDecimal dailyRent;

    @NotBlank(message = "成色不能为空")
    @Schema(description = "成色（字符串格式）：new, almost_new, lightly_used, obviously_used, has_flaws")
    @Pattern(regexp = "new|almost_new|lightly_used|obviously_used|has_flaws", message = "成色值无效")
    private String condition;

    @Schema(description = "成色等级（内部使用）：1-10，10为全新")
    private Integer conditionLevel;

    @Schema(description = "封面图片URL")
    private String coverImageUrl;

    @Schema(description = "图片URL列表")
    private java.util.List<String> imageUrls;

    @Schema(description = "可借用时间段（JSON格式）")
    private String availableTimes;
}

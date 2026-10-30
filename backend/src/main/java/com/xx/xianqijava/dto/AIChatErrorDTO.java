package com.xx.xianqijava.dto;

import com.xx.xianqijava.ai.AiChatErrorCode;
import com.xx.xianqijava.ai.AiChatException;
import com.xx.xianqijava.exception.BusinessException;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * HTTP、SSE 与 WebSocket 共用的 AI 聊天失败载荷。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI 聊天失败信息")
public class AIChatErrorDTO {

    @Schema(description = "稳定错误类型", example = "AI_DISABLED")
    private String type;

    @Schema(description = "业务错误码", example = "503")
    private Integer code;

    @Schema(description = "用户可读错误信息")
    private String message;

    @Schema(description = "是否建议重试")
    private Boolean retryable;

    public static AIChatErrorDTO from(AiChatErrorCode errorCode) {
        return AIChatErrorDTO.builder()
                .type(errorCode.name())
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .retryable(errorCode.isRetryable())
                .build();
    }

    public static AIChatErrorDTO from(Throwable error) {
        if (error instanceof AiChatException aiChatException) {
            return from(aiChatException.getErrorCode());
        }
        if (error instanceof BusinessException businessException) {
            return AIChatErrorDTO.builder()
                    .type("AI_SERVICE_ERROR")
                    .code(businessException.getCode())
                    .message(businessException.getMessage())
                    .retryable(true)
                    .build();
        }
        return from(AiChatErrorCode.AI_PROVIDER_ERROR);
    }
}

package com.xx.xianqijava.ai;

import lombok.Getter;

/**
 * AI 聊天对客户端暴露的稳定失败类型。
 */
@Getter
public enum AiChatErrorCode {

    AI_DISABLED(503, "AI 功能未启用", false),
    AI_NOT_READY(503, "AI 服务未就绪", false),
    AI_PROVIDER_ERROR(503, "AI 助手暂时无法回复，请稍后再试。", true),
    AI_STREAM_INTERRUPTED(503, "AI 流式响应中断，请重试", true),
    AI_PROCESS_INTERRUPTED(503, "AI 处理被中断，请重试", true),
    AI_INVALID_REQUEST(400, "请求格式错误", false),
    AI_EMPTY_MESSAGE(400, "消息不能为空", false),
    AI_EVENT_HANDLER_ERROR(500, "AI 请求处理失败", true);

    private final Integer code;
    private final String message;
    private final boolean retryable;

    AiChatErrorCode(Integer code, String message, boolean retryable) {
        this.code = code;
        this.message = message;
        this.retryable = retryable;
    }
}

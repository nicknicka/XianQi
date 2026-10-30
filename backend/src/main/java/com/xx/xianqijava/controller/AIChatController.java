package com.xx.xianqijava.controller;

import com.xx.xianqijava.ai.AiChatOutcome;
import com.xx.xianqijava.ai.AiChatErrorCode;
import com.xx.xianqijava.ai.AiChatException;
import com.xx.xianqijava.ai.AiChatService;
import com.xx.xianqijava.ai.config.AiProperties;
import com.xx.xianqijava.common.Result;
import com.xx.xianqijava.dto.AIChatHistoryVO;
import com.xx.xianqijava.dto.AIChatErrorDTO;
import com.xx.xianqijava.dto.AIChatRequest;
import com.xx.xianqijava.dto.AIConfigDTO;
import com.xx.xianqijava.service.AIChatHistoryService;
import com.xx.xianqijava.util.IdConverter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AI 聊天控制器，只负责 HTTP/SSE 协议适配。
 */
@Slf4j
@RestController
@RequestMapping("/ai")
@Tag(name = "AI聊天接口", description = "AI智能助手")
public class AIChatController {

    private final AiChatService aiChatService;
    private final AiProperties aiProperties;
    private final AIChatHistoryService chatHistoryService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public AIChatController(
            AiChatService aiChatService,
            AiProperties aiProperties,
            AIChatHistoryService chatHistoryService
    ) {
        this.aiChatService = aiChatService;
        this.aiProperties = aiProperties;
        this.chatHistoryService = chatHistoryService;
    }

    /**
     * 非流式聊天。
     */
    @PostMapping("/chat")
    @Operation(summary = "AI聊天", description = "与AI助手对话，自动识别意图并路由到对应Agent（非流式）")
    public Result<?> chat(@RequestBody AIChatRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("收到 AI 聊天请求：userId={}", request.getUserId());
        try {
            AiChatOutcome outcome = aiChatService.chat(
                    IdConverter.toLong(request.getUserId()), request.getMessage());
            log.info("AI 聊天完成：userId={}，intent={}，耗时={}ms",
                    request.getUserId(), outcome.intent(), System.currentTimeMillis() - startTime);
            return Result.success("AI回复成功", outcome.response());
        } catch (AiChatException e) {
            log.warn("AI 聊天未完成：userId={}，type={}，message={}",
                    request.getUserId(), e.getErrorCode(), e.getMessage());
            AIChatErrorDTO error = AIChatErrorDTO.from(e);
            return Result.error(error.getCode(), error.getMessage(), error);
        } catch (Exception e) {
            log.error("AI 聊天失败：userId={}", request.getUserId(), e);
            AIChatErrorDTO error = AIChatErrorDTO.from(e);
            return Result.error(error.getCode(), error.getMessage(), error);
        }
    }

    /**
     * SSE 流式聊天。未开启流式时由服务层降级为一次性返回。
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "AI流式聊天", description = "流式输出，未开启流式时自动降级")
    public SseEmitter chatStream(@RequestBody AIChatRequest request) {
        long requestTime = System.currentTimeMillis();
        SseEmitter emitter = new SseEmitter(300000L);

        executor.execute(() -> {
            Long userId = IdConverter.toLong(request.getUserId());
            try {
                aiChatService.stream(
                        userId,
                        request.getMessage(),
                        token -> {
                            try {
                                emitter.send(SseEmitter.event().data(token));
                            } catch (IOException e) {
                                throw new IllegalStateException("发送流式响应失败", e);
                            }
                        },
                        () -> {
                            try {
                                emitter.send(SseEmitter.event().data("[DONE]"));
                                emitter.complete();
                                log.info("AI 流式聊天完成：userId={}，耗时={}ms",
                                        userId, System.currentTimeMillis() - requestTime);
                            } catch (IOException e) {
                                emitter.completeWithError(e);
                            }
                        },
                        error -> {
                            log.error("AI 流式聊天失败：userId={}", userId, error);
                            sendError(emitter, error);
                        }
                );
            } catch (Exception e) {
                log.error("AI 流式聊天处理失败：userId={}", userId, e);
                sendError(emitter, e);
            }
        });

        emitter.onTimeout(() -> sendError(emitter, new AiChatException(AiChatErrorCode.AI_STREAM_INTERRUPTED)));
        emitter.onError(error -> log.error("AI SSE 连接错误：userId={}", request.getUserId(), error));
        return emitter;
    }

    private void sendError(SseEmitter emitter, Throwable error) {
        AIChatErrorDTO payload = AIChatErrorDTO.from(error);
        try {
            emitter.send(SseEmitter.event().name("error").data(payload));
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(error);
        }
    }

    /**
     * 获取聊天历史。
     */
    @GetMapping("/history/{userId}")
    @Operation(summary = "获取聊天历史", description = "获取用户的AI聊天历史记录")
    public Result<List<AIChatHistoryVO>> getHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        return Result.success(chatHistoryService.getHistory(userId, limit));
    }

    /**
     * 清除聊天历史。
     */
    @DeleteMapping("/history/{userId}")
    @Operation(summary = "清除聊天历史", description = "清除用户的AI聊天历史记录")
    public Result<Void> clearHistory(@PathVariable Long userId) {
        chatHistoryService.clearHistory(userId);
        return Result.success();
    }

    /**
     * 获取前端可见的 AI 配置，不暴露密钥与内部地址。
     */
    @GetMapping("/config")
    @Operation(summary = "获取AI配置", description = "获取AI功能的公开配置信息")
    public Result<AIConfigDTO> getConfig() {
        return Result.success(AIConfigDTO.builder()
                .enabled(aiProperties.isEnabled())
                .model(aiProperties.getChat().getModel())
                .maxTokens(aiProperties.getChat().getMaxTokens())
                .temperature(aiProperties.getChat().getTemperature())
                .chatMemorySize(aiProperties.getChat().getMemorySize())
                .streamEnabled(aiProperties.getChat().getStreamEnabled())
                .build());
    }
}

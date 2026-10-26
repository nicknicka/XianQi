package com.xx.xianqijava.ai;

import com.xx.xianqijava.agent.context.AIContext;
import com.xx.xianqijava.agent.service.IntentClassifierService;
import com.xx.xianqijava.ai.config.AiProperties;
import com.xx.xianqijava.common.ErrorCode;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.service.AIChatHistoryService;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * 统一的 AI 聊天服务：意图分类、智能体路由、流式输出与历史保存的唯一入口。
 */
@Slf4j
@Service
public class AiChatService {

    private final AiProperties properties;
    private final AiPromptCatalog promptCatalog;
    private final AIChatHistoryService chatHistoryService;
    private final ObjectProvider<AiAgents> agentsProvider;
    private final ObjectProvider<IntentClassifierService> classifierProvider;
    private final ObjectProvider<StreamingChatLanguageModel> streamingModelProvider;
    private final ObjectProvider<ChatMemoryProvider> memoryProviderProvider;

    public AiChatService(
            AiProperties properties,
            AiPromptCatalog promptCatalog,
            AIChatHistoryService chatHistoryService,
            ObjectProvider<AiAgents> agentsProvider,
            ObjectProvider<IntentClassifierService> classifierProvider,
            ObjectProvider<StreamingChatLanguageModel> streamingModelProvider,
            ObjectProvider<ChatMemoryProvider> memoryProviderProvider
    ) {
        this.properties = properties;
        this.promptCatalog = promptCatalog;
        this.chatHistoryService = chatHistoryService;
        this.agentsProvider = agentsProvider;
        this.classifierProvider = classifierProvider;
        this.streamingModelProvider = streamingModelProvider;
        this.memoryProviderProvider = memoryProviderProvider;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    /**
     * 非流式聊天：意图分类 -> 路由到智能体 -> 保存历史。
     */
    public AiChatOutcome chat(Long userId, String message) {
        ensureEnabled();
        String intent = classify(message);
        String response = routeWithContext(userId, intent, message);
        chatHistoryService.saveHistory(userId, message, response, intent);
        return new AiChatOutcome(intent, response);
    }

    /**
     * 流式聊天。关闭流式或缺少流式模型时，降级为一次性返回完整回复。
     */
    public void stream(
            Long userId,
            String message,
            Consumer<String> onToken,
            Runnable onComplete,
            Consumer<Throwable> onError
    ) {
        try {
            ensureEnabled();
            String intent = classify(message);

            StreamingChatLanguageModel streamingModel = streamingModelProvider.getIfAvailable();
            if (!Boolean.TRUE.equals(properties.getChat().getStreamEnabled()) || streamingModel == null) {
                AiChatOutcome outcome = new AiChatOutcome(intent, routeWithContext(userId, intent, message));
                chatHistoryService.saveHistory(userId, message, outcome.response(), intent);
                onToken.accept(outcome.response());
                onComplete.run();
                return;
            }

            ChatMemory memory = memoryProviderProvider.getIfAvailable() == null
                    ? null
                    : memoryProviderProvider.getObject().get(String.valueOf(userId));

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(SystemMessage.from(promptCatalog.forIntent(intent)));
            if (memory != null) {
                messages.addAll(memory.messages());
            }
            messages.add(UserMessage.from(message));

            StringBuilder fullResponse = new StringBuilder();
            streamingModel.generate(messages, new StreamingResponseHandler<AiMessage>() {
                @Override
                public void onNext(String token) {
                    fullResponse.append(token);
                    onToken.accept(token);
                }

                @Override
                public void onComplete(Response<AiMessage> response) {
                    if (memory != null) {
                        memory.add(UserMessage.from(message));
                        memory.add(AiMessage.from(fullResponse.toString()));
                    }
                    chatHistoryService.saveHistory(userId, message, fullResponse.toString(), intent);
                    onComplete.run();
                }

                @Override
                public void onError(Throwable error) {
                    log.error("AI 流式响应失败：userId={}", userId, error);
                    onError.accept(error);
                }
            });
        } catch (Exception e) {
            log.error("AI 流式聊天失败：userId={}", userId, e);
            onError.accept(e);
        }
    }

    public String classify(String message) {
        IntentClassifierService classifier = classifierProvider.getIfAvailable();
        return classifier == null ? "GENERAL" : classifier.classifyIntent(message);
    }

    private String route(Long userId, String intent, String message) {
        AiAgents agents = agentsProvider.getIfAvailable();
        if (agents == null) {
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI 服务未就绪");
        }
        String memoryId = String.valueOf(userId);
        return switch (intent) {
            case "CUSTOMER_SERVICE" -> agents.customerService().chat(memoryId, message);
            case "RECOMMENDATION" -> agents.recommendation().recommend(memoryId, message);
            case "DESCRIPTION" -> agents.description().optimizeDescription(memoryId, message);
            case "PRICING" -> agents.pricing().advisePrice(memoryId, message);
            case "SAFETY" -> agents.safety().checkSafety(memoryId, message);
            case "GREETING" -> AiPromptCatalog.GREETING_RESPONSE;
            default -> AiPromptCatalog.FALLBACK_RESPONSE;
        };
    }

    private String routeWithContext(Long userId, String intent, String message) {
        AIContext.setCurrentUserId(userId);
        try {
            return route(userId, intent, message);
        } finally {
            AIContext.clearCurrentUserId();
        }
    }

    private void ensureEnabled() {
        if (!properties.isEnabled()) {
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI 功能未启用");
        }
    }
}

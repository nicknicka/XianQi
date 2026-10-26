package com.xx.xianqijava.ai.provider.zhipu;

import com.xx.xianqijava.ai.AiModelFactory;
import com.xx.xianqijava.ai.config.AiProperties;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.zhipu.ZhipuAiChatModel;
import dev.langchain4j.model.zhipu.ZhipuAiStreamingChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 智谱 AI 适配器。智谱 SDK 只允许出现在本包内。
 */
@Component
@ConditionalOnProperty(prefix = "ai", name = "provider", havingValue = "zhipu")
public class ZhipuAiModelFactory implements AiModelFactory {

    private final AiProperties properties;

    public ZhipuAiModelFactory(AiProperties properties) {
        this.properties = properties;
        properties.validateIfEnabled();
    }

    @Override
    public ChatLanguageModel createChatModel() {
        return ZhipuAiChatModel.builder()
                .apiKey(properties.getApiKey())
                .baseUrl(properties.getBaseUrl())
                .model(properties.getChat().getModel())
                .temperature(properties.getChat().getTemperature())
                .maxToken(properties.getChat().getMaxTokens())
                .maxRetries(properties.getChat().getMaxRetries())
                .callTimeout(timeout())
                .connectTimeout(timeout())
                .writeTimeout(timeout())
                .readTimeout(timeout())
                .build();
    }

    @Override
    public StreamingChatLanguageModel createStreamingChatModel() {
        return ZhipuAiStreamingChatModel.builder()
                .apiKey(properties.getApiKey())
                .baseUrl(properties.getBaseUrl())
                .model(properties.getChat().getModel())
                .temperature(properties.getChat().getTemperature())
                .maxToken(properties.getChat().getMaxTokens())
                .callTimeout(timeout())
                .connectTimeout(timeout())
                .writeTimeout(timeout())
                .readTimeout(timeout())
                .build();
    }

    private Duration timeout() {
        return Duration.ofMillis(properties.getTimeoutMs());
    }
}

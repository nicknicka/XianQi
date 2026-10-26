package com.xx.xianqijava.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * 厂商无关的 AI 配置。
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of("zhipu");

    private boolean enabled;
    private String provider;
    private String apiKey;
    private String baseUrl;
    private Integer timeoutMs;
    private Chat chat = new Chat();

    public void validateIfEnabled() {
        if (!enabled) {
            return;
        }
        requireText(provider, "AI_PROVIDER");
        if (!SUPPORTED_PROVIDERS.contains(provider)) {
            throw new IllegalStateException("AI_PROVIDER 不支持: " + provider);
        }
        requireText(apiKey, "AI_API_KEY");
        requireText(baseUrl, "AI_BASE_URL");
        requirePositive(timeoutMs, "AI_TIMEOUT_MS");
        requireText(chat.getModel(), "AI_CHAT_MODEL");
        requirePositive(chat.getMaxTokens(), "AI_CHAT_MAX_TOKENS");
        requirePositive(chat.getMemorySize(), "AI_CHAT_MEMORY_SIZE");
        requirePositive(chat.getMaxMemoryUsers(), "AI_CHAT_MAX_MEMORY_USERS");
        if (chat.getMaxRetries() == null || chat.getMaxRetries() < 0) {
            throw new IllegalStateException("AI_CHAT_MAX_RETRIES 必须为非负整数");
        }
        if (chat.getTemperature() == null || chat.getTemperature() < 0 || chat.getTemperature() > 1) {
            throw new IllegalStateException("AI_CHAT_TEMPERATURE 必须在 0 到 1 之间");
        }
        if (chat.getStreamEnabled() == null) {
            throw new IllegalStateException("AI_CHAT_STREAM_ENABLED 不能为空");
        }
    }

    private void requireText(String value, String name) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(name + " 不能为空");
        }
    }

    private void requirePositive(Integer value, String name) {
        if (value == null || value <= 0) {
            throw new IllegalStateException(name + " 必须为正整数");
        }
    }

    @Data
    public static class Chat {
        private String model;
        private Double temperature;
        private Integer maxTokens;
        private Integer memorySize;
        private Integer maxMemoryUsers;
        private Integer maxRetries;
        private Boolean streamEnabled;
    }
}

package com.xx.xianqijava.ai.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiPropertiesTest {

    @Test
    void disabledAiDoesNotRequireProviderConfiguration() {
        AiProperties properties = validProperties();
        properties.setEnabled(false);
        properties.setProvider(null);
        properties.setApiKey(null);
        properties.setBaseUrl(null);
        properties.getChat().setModel(null);

        assertDoesNotThrow(properties::validateIfEnabled);
    }

    @Test
    void enabledAiRequiresApiKey() {
        AiProperties properties = validProperties();
        properties.setApiKey(" ");

        IllegalStateException error = assertThrows(IllegalStateException.class, properties::validateIfEnabled);

        org.junit.jupiter.api.Assertions.assertEquals("AI_API_KEY 不能为空", error.getMessage());
    }

    @Test
    void enabledAiRejectsUnsupportedProvider() {
        AiProperties properties = validProperties();
        properties.setProvider("unknown");

        IllegalStateException error = assertThrows(IllegalStateException.class, properties::validateIfEnabled);

        org.junit.jupiter.api.Assertions.assertEquals("AI_PROVIDER 不支持: unknown", error.getMessage());
    }

    private AiProperties validProperties() {
        AiProperties properties = new AiProperties();
        properties.setEnabled(true);
        properties.setProvider("zhipu");
        properties.setApiKey("test-key");
        properties.setBaseUrl("https://example.invalid/");
        properties.setTimeoutMs(60000);
        properties.getChat().setModel("test-model");
        properties.getChat().setTemperature(0.7);
        properties.getChat().setMaxTokens(2000);
        properties.getChat().setMemorySize(20);
        properties.getChat().setMaxMemoryUsers(1000);
        properties.getChat().setMaxRetries(2);
        properties.getChat().setStreamEnabled(true);
        return properties;
    }
}

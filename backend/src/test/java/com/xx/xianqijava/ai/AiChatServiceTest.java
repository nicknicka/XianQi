package com.xx.xianqijava.ai;

import com.xx.xianqijava.ai.config.AiProperties;
import com.xx.xianqijava.service.AIChatHistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class AiChatServiceTest {

    @Test
    void disabledAiReturnsServiceUnavailable() {
        AiProperties properties = new AiProperties();
        properties.setEnabled(false);

        AiChatService service = new AiChatService(
                properties,
                new AiPromptCatalog(),
                mock(AIChatHistoryService.class),
                provider(),
                provider(),
                provider(),
                provider()
        );

        AiChatException error = assertThrows(AiChatException.class,
                () -> service.chat(1L, "你好"));

        assertEquals(503, error.getCode());
        assertEquals("AI 功能未启用", error.getMessage());
        assertEquals(AiChatErrorCode.AI_DISABLED, error.getErrorCode());
    }

    @SuppressWarnings("unchecked")
    private <T> ObjectProvider<T> provider() {
        return mock(ObjectProvider.class);
    }
}

package com.xx.xianqijava.ai;

import com.xx.xianqijava.agent.service.IntentClassifierService;
import com.xx.xianqijava.ai.config.AiProperties;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.service.AIChatHistoryService;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
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

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.chat(1L, "你好"));

        assertEquals(503, error.getCode());
        assertEquals("AI 功能未启用", error.getMessage());
    }

    @SuppressWarnings("unchecked")
    private <T> ObjectProvider<T> provider() {
        return mock(ObjectProvider.class);
    }
}

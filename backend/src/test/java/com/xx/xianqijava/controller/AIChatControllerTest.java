package com.xx.xianqijava.controller;

import com.xx.xianqijava.ai.AiChatErrorCode;
import com.xx.xianqijava.ai.AiChatException;
import com.xx.xianqijava.ai.AiChatService;
import com.xx.xianqijava.ai.config.AiProperties;
import com.xx.xianqijava.common.Result;
import com.xx.xianqijava.dto.AIChatErrorDTO;
import com.xx.xianqijava.dto.AIChatRequest;
import com.xx.xianqijava.dto.AIConfigDTO;
import com.xx.xianqijava.service.AIChatHistoryService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AIChatControllerTest {

    @Test
    void configUsesConfiguredModelAndNeverReturnsSecrets() {
        AiProperties properties = new AiProperties();
        properties.setEnabled(true);
        properties.setApiKey("secret-key");
        properties.setBaseUrl("https://provider.invalid/");
        properties.getChat().setModel("configured-model");
        properties.getChat().setMaxTokens(1234);
        properties.getChat().setTemperature(0.5);
        properties.getChat().setMemorySize(10);
        properties.getChat().setStreamEnabled(false);

        AIChatController controller = new AIChatController(
                mock(AiChatService.class),
                properties,
                mock(AIChatHistoryService.class)
        );

        Result<AIConfigDTO> result = controller.getConfig();

        assertEquals(200, result.getCode());
        assertEquals("configured-model", result.getData().getModel());
        assertEquals(1234, result.getData().getMaxTokens());
        assertEquals(0.5, result.getData().getTemperature());
        assertEquals(10, result.getData().getChatMemorySize());
        assertEquals(false, result.getData().getStreamEnabled());
    }

    @Test
    void disabledAiReturnsStructuredHttpErrorPayload() {
        AiChatService service = mock(AiChatService.class);
        when(service.chat(1001L, "你好")).thenThrow(new AiChatException(AiChatErrorCode.AI_DISABLED));

        AIChatController controller = new AIChatController(
                service,
                new AiProperties(),
                mock(AIChatHistoryService.class)
        );
        AIChatRequest request = new AIChatRequest();
        request.setUserId("1001");
        request.setMessage("你好");

        Result<?> result = controller.chat(request);

        assertThat(result.getCode()).isEqualTo(503);
        assertThat(result.getMessage()).isEqualTo("AI 功能未启用");
        assertThat(result.getData()).isInstanceOf(AIChatErrorDTO.class);
        AIChatErrorDTO error = (AIChatErrorDTO) result.getData();
        assertThat(error.getType()).isEqualTo("AI_DISABLED");
        assertThat(error.getRetryable()).isFalse();
    }
}

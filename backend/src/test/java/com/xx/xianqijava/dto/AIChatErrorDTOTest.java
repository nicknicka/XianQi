package com.xx.xianqijava.dto;

import com.xx.xianqijava.ai.AiChatErrorCode;
import com.xx.xianqijava.ai.AiChatException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AIChatErrorDTOTest {

    @Test
    void mapsDisabledAiToStableError() {
        AIChatErrorDTO error = AIChatErrorDTO.from(new AiChatException(AiChatErrorCode.AI_DISABLED));

        assertThat(error.getType()).isEqualTo("AI_DISABLED");
        assertThat(error.getCode()).isEqualTo(503);
        assertThat(error.getMessage()).isEqualTo("AI 功能未启用");
        assertThat(error.getRetryable()).isFalse();
    }

    @Test
    void mapsProviderFailureToRetryableError() {
        AIChatErrorDTO error = AIChatErrorDTO.from(new RuntimeException("provider unavailable"));

        assertThat(error.getType()).isEqualTo("AI_PROVIDER_ERROR");
        assertThat(error.getCode()).isEqualTo(503);
        assertThat(error.getMessage()).isEqualTo("AI 助手暂时无法回复，请稍后再试。");
        assertThat(error.getRetryable()).isTrue();
    }
}

package com.xx.xianqijava.ai;

import com.xx.xianqijava.exception.BusinessException;
import lombok.Getter;

/**
 * 带有稳定 AI 错误类型的业务异常。
 */
@Getter
public class AiChatException extends BusinessException {

    private final AiChatErrorCode errorCode;

    public AiChatException(AiChatErrorCode errorCode) {
        super(errorCode.getCode(), errorCode.getMessage());
        this.errorCode = errorCode;
    }
}

package com.xx.xianqijava.ai;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;

/**
 * AI 服务商模型工厂。业务层只依赖 LangChain4j 的通用模型接口。
 */
public interface AiModelFactory {

    ChatLanguageModel createChatModel();

    StreamingChatLanguageModel createStreamingChatModel();
}

package com.xx.xianqijava.ai.config;

import com.xx.xianqijava.agent.CustomerServiceAgent;
import com.xx.xianqijava.agent.PricingAdvisorAgent;
import com.xx.xianqijava.agent.ProductDescriptionAgent;
import com.xx.xianqijava.agent.ProductRecommendationAgent;
import com.xx.xianqijava.agent.TradeSafetyAgent;
import com.xx.xianqijava.agent.tools.SafetyTools;
import com.xx.xianqijava.agent.tools.SystemTools;
import com.xx.xianqijava.agent.tools.UserTools;
import com.xx.xianqijava.ai.AiModelFactory;
import com.xx.xianqijava.ai.AiAgents;
import com.xx.xianqijava.ai.memory.BoundedChatMemoryProvider;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.service.AiServices;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI 模型与智能体装配。启用 AI 时才创建这些 Bean。
 */
@Slf4j
@Configuration
@ConditionalOnProperty(prefix = "ai", name = "enabled", havingValue = "true")
public class AiAgentConfig {

    private final AiProperties properties;
    private final AiModelFactory modelFactory;
    private final UserTools userTools;
    private final SystemTools systemTools;
    private final SafetyTools safetyTools;

    public AiAgentConfig(
            AiProperties properties,
            AiModelFactory modelFactory,
            UserTools userTools,
            SystemTools systemTools,
            SafetyTools safetyTools
    ) {
        this.properties = properties;
        this.modelFactory = modelFactory;
        this.userTools = userTools;
        this.systemTools = systemTools;
        this.safetyTools = safetyTools;
    }

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        log.info("初始化 AI 聊天模型，provider={}，model={}",
                properties.getProvider(), properties.getChat().getModel());
        return modelFactory.createChatModel();
    }

    @Bean
    public StreamingChatLanguageModel streamingChatLanguageModel() {
        return modelFactory.createStreamingChatModel();
    }

    @Bean
    public ChatMemoryProvider chatMemoryProvider() {
        return new BoundedChatMemoryProvider(
                properties.getChat().getMemorySize(),
                properties.getChat().getMaxMemoryUsers());
    }

    @Bean
    public CustomerServiceAgent customerServiceAgent(
            ChatLanguageModel chatLanguageModel,
            ChatMemoryProvider chatMemoryProvider
    ) {
        return AiServices.builder(CustomerServiceAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider)
                .tools(systemTools)
                .build();
    }

    @Bean
    public AiAgents aiAgents(
            CustomerServiceAgent customerService,
            ProductRecommendationAgent recommendation,
            ProductDescriptionAgent description,
            PricingAdvisorAgent pricing,
            TradeSafetyAgent safety
    ) {
        return new AiAgents(customerService, recommendation, description, pricing, safety);
    }

    @Bean
    public ProductRecommendationAgent recommendationAgent(
            ChatLanguageModel chatLanguageModel,
            ChatMemoryProvider chatMemoryProvider
    ) {
        return AiServices.builder(ProductRecommendationAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider)
                .tools(userTools, systemTools)
                .build();
    }

    @Bean
    public ProductDescriptionAgent descriptionAgent(ChatLanguageModel chatLanguageModel) {
        return AiServices.builder(ProductDescriptionAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider())
                .build();
    }

    @Bean
    public PricingAdvisorAgent pricingAdvisorAgent(ChatLanguageModel chatLanguageModel) {
        return AiServices.builder(PricingAdvisorAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider())
                .build();
    }

    @Bean
    public TradeSafetyAgent safetyAgent(
            ChatLanguageModel chatLanguageModel,
            ChatMemoryProvider chatMemoryProvider
    ) {
        return AiServices.builder(TradeSafetyAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(chatMemoryProvider)
                .tools(safetyTools, userTools)
                .build();
    }
}

package com.xx.xianqijava.ai;

import com.xx.xianqijava.agent.CustomerServiceAgent;
import com.xx.xianqijava.agent.PricingAdvisorAgent;
import com.xx.xianqijava.agent.ProductDescriptionAgent;
import com.xx.xianqijava.agent.ProductRecommendationAgent;
import com.xx.xianqijava.agent.TradeSafetyAgent;

/**
 * 已装配的智能体集合。
 */
public record AiAgents(
        CustomerServiceAgent customerService,
        ProductRecommendationAgent recommendation,
        ProductDescriptionAgent description,
        PricingAdvisorAgent pricing,
        TradeSafetyAgent safety
) {
}

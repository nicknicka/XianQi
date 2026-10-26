package com.xx.xianqijava.ai;

/**
 * 一次 AI 聊天的结果。
 *
 * @param intent   识别出的意图
 * @param response AI 回复内容
 */
public record AiChatOutcome(String intent, String response) {
}

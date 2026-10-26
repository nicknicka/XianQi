package com.xx.xianqijava.ai.memory;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 按用户隔离并限制总条目数的内存对话记忆。
 */
public class BoundedChatMemoryProvider implements ChatMemoryProvider {

    private final int maxMessages;
    private final Map<Object, ChatMemory> memories;

    public BoundedChatMemoryProvider(int maxMessages, int maxEntries) {
        this.maxMessages = maxMessages;
        this.memories = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<Object, ChatMemory> eldest) {
                return size() > maxEntries;
            }
        };
    }

    @Override
    public synchronized ChatMemory get(Object memoryId) {
        return memories.computeIfAbsent(memoryId,
                id -> MessageWindowChatMemory.builder().id(id).maxMessages(maxMessages).build());
    }
}

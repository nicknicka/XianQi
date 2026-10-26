package com.xx.xianqijava.ai.memory;

import dev.langchain4j.memory.ChatMemory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;

class BoundedChatMemoryProviderTest {

    @Test
    void isolatesMemoryByUserAndEvictsLeastRecentlyUsedEntry() {
        BoundedChatMemoryProvider provider = new BoundedChatMemoryProvider(20, 2);

        ChatMemory firstUser = provider.get("1");
        assertSame(firstUser, provider.get("1"));
        assertNotSame(firstUser, provider.get("2"));

        provider.get("3");

        assertNotSame(firstUser, provider.get("1"));
    }
}

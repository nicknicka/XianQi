package com.xx.xianqijava.websocket;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.lang.reflect.Field;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebSocketHandlerTest {

    private static final Long USER_ID = 1001L;

    private final WebSocketHandler handler = new WebSocketHandler();

    @AfterEach
    void clearSessions() {
        sessions().clear();
    }

    @Test
    void closingOldSessionKeepsReplacementSession() throws Exception {
        WebSocketSession oldSession = session("old");
        WebSocketSession replacementSession = session("new");
        sessions().put(USER_ID, replacementSession);

        handler.afterConnectionClosed(oldSession, CloseStatus.NORMAL);

        assertThat(sessions().get(USER_ID)).isSameAs(replacementSession);
    }

    @Test
    void transportErrorOnOldSessionKeepsReplacementSession() throws Exception {
        WebSocketSession oldSession = session("old");
        WebSocketSession replacementSession = session("new");
        sessions().put(USER_ID, replacementSession);

        handler.handleTransportError(oldSession, new RuntimeException("old connection failed"));

        assertThat(sessions().get(USER_ID)).isSameAs(replacementSession);
    }

    private WebSocketSession session(String id) {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn(id);
        when(session.getAttributes()).thenReturn(Map.of("userId", USER_ID));
        return session;
    }

    @SuppressWarnings("unchecked")
    private Map<Long, WebSocketSession> sessions() {
        try {
            Field field = WebSocketHandler.class.getDeclaredField("USER_SESSIONS");
            field.setAccessible(true);
            return (Map<Long, WebSocketSession>) field.get(null);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("无法读取 WebSocket 会话注册表", e);
        }
    }
}

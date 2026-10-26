package com.xx.xianqijava;

import org.springframework.data.redis.connection.RedisConnection;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class XianQiJavaApplicationIT {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private org.springframework.data.redis.connection.RedisConnectionFactory redisConnectionFactory;

    @Test
    void contextLoads() {
    }

    @Test
    void externalServicesAreAvailable() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertTrue(connection.isValid(5));
        }
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            assertEquals("PONG", connection.ping());
        }
    }
}

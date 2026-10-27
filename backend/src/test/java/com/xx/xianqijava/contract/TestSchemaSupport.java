package com.xx.xianqijava.contract;

import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;

/**
 * 集成测试共享的 schema 初始化。
 *
 * <p>{@code sql/schema.sql} 是为空库一次性初始化设计的（无 DROP / IF NOT EXISTS），
 * 因此同一测试 JVM 内只能执行一次；否则第二个执行它的测试类会因
 * "Table 'user' already exists" 失败。这里用 JVM 级守卫保证只初始化一次，
 * 让多个 {@code *IT} 类可以共存且与执行顺序无关。
 */
final class TestSchemaSupport {

    private static boolean initialized = false;

    private TestSchemaSupport() {
    }

    static synchronized void ensureSchema(DataSource dataSource) throws Exception {
        if (initialized) {
            return;
        }
        Path schema = Path.of("..", "sql", "schema.sql").normalize();
        if (!Files.exists(schema)) {
            throw new IllegalStateException("schema.sql must be reachable from backend/: " + schema);
        }
        try (Connection conn = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(conn, new FileSystemResource(schema));
        }
        initialized = true;
    }
}

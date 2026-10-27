package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Admin;
import com.xx.xianqijava.entity.AdminLoginLog;
import com.xx.xianqijava.entity.OperationLog;
import com.xx.xianqijava.mapper.AdminLoginLogMapper;
import com.xx.xianqijava.mapper.AdminMapper;
import com.xx.xianqijava.mapper.OperationLogMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 管理后台实体（Admin / AdminLoginLog / OperationLog）必须在真实 schema 上可用。
 *
 * <p>回归 issue #28/#29：{@code Admin.id} 与 {@code AdminLoginLog.id} 曾映射到
 * 并不存在的 {@code id} 列（schema 为 {@code admin_id} / {@code log_id}），
 * {@code OperationLog.userId} 曾映射到并不存在的 {@code user_id}（schema 为 {@code admin_id}）。
 * 任何管理员登录、日志写入或日志查询都会在真实库上失败。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AdminOperationLogColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long ADMIN_ID = 8_100_000_000_000_001L;
    private static final String ADMIN_USERNAME = "col_admin_" + RUN_ID;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private AdminMapper adminMapper;

    @Autowired
    private AdminLoginLogMapper adminLoginLogMapper;

    @Autowired
    private OperationLogMapper operationLogMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        // operation_log / admin_login_log 的 admin_id 有外键指向 admin，先落一条管理员。
        fixtures.admin(ADMIN_ID, ADMIN_USERNAME);
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM admin_login_log WHERE admin_id = " + ADMIN_ID);
            stmt.executeUpdate("DELETE FROM operation_log WHERE admin_id = " + ADMIN_ID);
            stmt.executeUpdate("DELETE FROM admin WHERE admin_id = " + ADMIN_ID);
        }
    }

    @Test
    void admin_selectByUsername_works() {
        // 管理员登录使用的查询路径：按 username 查一条
        Admin found = adminMapper.selectOne(
            new LambdaQueryWrapper<Admin>().eq(Admin::getUsername, ADMIN_USERNAME));
        assertNotNull(found, "selectOne by username must not fail on the admin columns");
        assertEquals(ADMIN_ID, found.getAdminId());
        assertEquals(ADMIN_USERNAME, found.getUsername());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void adminLoginLog_insertAndSelect_roundTripsSchemaColumns() {
        AdminLoginLog logRow = new AdminLoginLog();
        logRow.setAdminId(ADMIN_ID);
        logRow.setUsername(ADMIN_USERNAME);
        logRow.setLoginTime(LocalDateTime.now());
        logRow.setIp("127.0.0.1");
        logRow.setBrowser("JUnit");
        logRow.setStatus(1);
        adminLoginLogMapper.insert(logRow);

        assertNotNull(logRow.getLogId(), "log_id should be generated on insert");
        AdminLoginLog found = adminLoginLogMapper.selectById(logRow.getLogId());
        assertNotNull(found, "selectById must not fail on the admin_login_log columns");
        assertEquals(ADMIN_ID, found.getAdminId());
        assertEquals(ADMIN_USERNAME, found.getUsername());
        assertEquals(1, found.getStatus());
    }

    @Test
    void operationLog_insertAndQueryByAdminId_roundTripsSchemaColumns() {
        OperationLog logRow = new OperationLog();
        logRow.setAdminId(ADMIN_ID);
        logRow.setUsername(ADMIN_USERNAME);
        logRow.setModule("report");
        logRow.setAction("handle");
        logRow.setDescription("列名契约冒烟 " + RUN_ID);
        logRow.setRequestMethod("PUT");
        logRow.setRequestUrl("/admin/report/1/handle");
        logRow.setIpAddress("127.0.0.1");
        logRow.setExecuteTime(12L);
        logRow.setStatus(1);
        operationLogMapper.insert(logRow);

        assertNotNull(logRow.getLogId(), "log_id should be generated on insert");

        OperationLog found = operationLogMapper.selectById(logRow.getLogId());
        assertNotNull(found, "selectById must not fail on the operation_log columns");
        assertEquals(ADMIN_ID, found.getAdminId());
        assertEquals("report", found.getModule());

        long count = operationLogMapper.selectCount(
            new LambdaQueryWrapper<OperationLog>().eq(OperationLog::getAdminId, ADMIN_ID));
        assertTrue(count >= 1, "admin_id query must resolve on real columns");
    }
}

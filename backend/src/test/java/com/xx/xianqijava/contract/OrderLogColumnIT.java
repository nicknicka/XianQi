package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.OrderLog;
import com.xx.xianqijava.mapper.OrderLogMapper;
import com.xx.xianqijava.service.OrderLogService;
import com.xx.xianqijava.vo.OrderLogVO;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 订单操作日志独立表（#46 / ADR-0010）必须在真实 schema 上可用，
 * 且能按用户 ID 关联（这是旧 operation_log 方案丢失的能力）。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrderLogColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long BUYER_ID = 4_100_000_000_000_001L;
    private static final Long SELLER_ID = 4_200_000_000_000_001L;
    private static final Long CATEGORY_ID = 4_300_000_000_000_001L;
    private static final Long PRODUCT_ID = 4_400_000_000_000_001L;
    private static final Long ORDER_ID = 4_500_000_000_000_001L;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private OrderLogMapper orderLogMapper;

    @Autowired
    private OrderLogService orderLogService;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        fixtures.user(BUYER_ID, "ol_buyer_" + RUN_ID, "133" + RUN_ID);
        fixtures.user(SELLER_ID, "ol_seller_" + RUN_ID, "132" + RUN_ID);
        fixtures.category(CATEGORY_ID, "订单日志契约分类", "ol_" + RUN_ID);
        fixtures.product(PRODUCT_ID, SELLER_ID, CATEGORY_ID,
            "订单日志契约商品 " + RUN_ID, new BigDecimal("12.00"));
        fixtures.order(ORDER_ID, "OL" + RUN_ID, BUYER_ID, SELLER_ID, PRODUCT_ID,
            new BigDecimal("12.00"));
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM order_log WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM `order` WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id IN (" + BUYER_ID + ", " + SELLER_ID + ")");
        }
    }

    @Test
    void orderLog_insertAndSelect_roundTripsSchemaColumns() {
        OrderLog row = new OrderLog();
        row.setOrderId(ORDER_ID);
        row.setOperatorId(BUYER_ID);
        row.setOperatorName("买家");
        row.setAction("create");
        row.setDetail("创建订单 OL" + RUN_ID);
        orderLogMapper.insert(row);

        assertNotNull(row.getOrderLogId(), "order_log_id should be generated on insert");
        OrderLog found = orderLogMapper.selectById(row.getOrderLogId());
        assertNotNull(found, "selectById must not fail on the order_log columns");
        assertEquals(ORDER_ID, found.getOrderId());
        assertEquals(BUYER_ID, found.getOperatorId(), "operator_id must round-trip");
        assertEquals("create", found.getAction());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void getOrderLogs_returnsChronologicalVoWithUserIdentity() {
        orderLogService.record(ORDER_ID, BUYER_ID, "买家", "create", "创建订单");
        orderLogService.record(ORDER_ID, SELLER_ID, "卖家", "confirm", "确认订单");
        orderLogService.record(ORDER_ID, BUYER_ID, "买家", "complete", "完成订单");

        List<OrderLogVO> logs = orderLogService.getOrderLogs(ORDER_ID);
        assertEquals(3, logs.size(), "three logged actions should be returned");
        assertEquals("create", logs.get(0).getAction());
        assertEquals("confirm", logs.get(1).getAction());
        assertEquals("complete", logs.get(2).getAction());
        assertEquals("创建订单", logs.get(0).getActionText(), "action code must map to display text");
        assertEquals(String.valueOf(BUYER_ID), logs.get(0).getUserId(),
            "operator_id must surface as userId — the capability operation_log lost");
    }

    @Test
    void orderLogs_areQueryableByOperatorId() {
        // 自包含：不依赖其它测试先写入的数据，避免执行顺序影响结果。
        orderLogService.record(ORDER_ID, SELLER_ID, "卖家", "refund_approve", "同意退款");

        long count = orderLogMapper.selectCount(
            new LambdaQueryWrapper<OrderLog>()
                .eq(OrderLog::getOperatorId, SELLER_ID)
        );
        assertTrue(count >= 1, "order logs must be queryable by operator_id");
    }
}

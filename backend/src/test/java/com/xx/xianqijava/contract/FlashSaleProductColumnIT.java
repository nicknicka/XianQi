package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.xx.xianqijava.entity.FlashSaleProduct;
import com.xx.xianqijava.mapper.FlashSaleProductMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Statement;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * FlashSaleProduct 必须在真实 schema 上可用（回归 issue #45）。
 *
 * <p>实体曾把主键映射为不存在的 {@code id}（schema 为 {@code flash_sale_id}），
 * 并用 {@code stockStatus} 映射不存在的 {@code stock_status}（schema 为 {@code status}），
 * 任何查询或条件更新都会报 Unknown column。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 * 每个测试自建自清自己的秒杀商品行，保证与执行顺序无关。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FlashSaleProductColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long SELLER_ID = 3_100_000_000_000_001L;
    private static final Long CATEGORY_ID = 3_200_000_000_000_001L;
    private static final Long PRODUCT_ID = 3_300_000_000_000_001L;
    private static final Long SESSION_ID = 3_400_000_000_000_001L;
    private static final Long FLASH_SALE_ID = 3_500_000_000_000_001L;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private FlashSaleProductMapper flashSaleProductMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        fixtures.user(SELLER_ID, "fsp_" + RUN_ID, "131" + RUN_ID);
        fixtures.category(CATEGORY_ID, "秒杀商品契约分类", "fsp_" + RUN_ID);
        fixtures.product(PRODUCT_ID, SELLER_ID, CATEGORY_ID,
            "秒杀商品契约 " + RUN_ID, new BigDecimal("80.00"));
        fixtures.flashSaleSession(SESSION_ID, "秒杀商品契约场次 " + RUN_ID);
    }

    /** 每个测试结束后清掉本测试写入的秒杀商品行（避免外键阻塞父行清理）。 */
    @AfterEach
    void removeFlashSaleProducts() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                "DELETE FROM flash_sale_product WHERE session_id = " + SESSION_ID);
        }
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM flash_sale_session WHERE session_id = " + SESSION_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id = " + SELLER_ID);
        }
    }

    private FlashSaleProduct buildFlashSaleProduct(Long flashSaleId, int stockStatus, int soldCount) {
        FlashSaleProduct row = new FlashSaleProduct();
        row.setFlashSaleId(flashSaleId);
        row.setSessionId(SESSION_ID);
        row.setProductId(PRODUCT_ID);
        row.setFlashPrice(new BigDecimal("50.00"));
        row.setStockCount(10);
        row.setSoldCount(soldCount);
        row.setLimitPerUser(1);
        row.setRepeatType(1);
        row.setStatus(stockStatus);
        row.setSortOrder(0);
        return row;
    }

    @Test
    void flashSaleProduct_insertAndSelect_roundTripsSchemaColumns() {
        flashSaleProductMapper.insert(buildFlashSaleProduct(FLASH_SALE_ID, 0, 0));

        FlashSaleProduct found = flashSaleProductMapper.selectById(FLASH_SALE_ID);
        assertNotNull(found, "selectById must not fail on the flash_sale_product columns");
        assertEquals(FLASH_SALE_ID, found.getFlashSaleId(), "primary key must map to flash_sale_id");
        assertEquals(SESSION_ID, found.getSessionId());
        assertEquals(PRODUCT_ID, found.getProductId());
        assertEquals(0, found.getStatus(), "status column must map");
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled via BaseEntity");
    }

    @Test
    void stockStatusUpdate_targetsRealStatusColumn() {
        flashSaleProductMapper.insert(buildFlashSaleProduct(FLASH_SALE_ID, 1, 10)); // 已售罄

        // 调度任务使用的条件更新路径：eq(status,1) + set(status,0)
        LambdaUpdateWrapper<FlashSaleProduct> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(FlashSaleProduct::getFlashSaleId, FLASH_SALE_ID)
               .eq(FlashSaleProduct::getStatus, 1)
               .set(FlashSaleProduct::getSoldCount, 0)
               .set(FlashSaleProduct::getStatus, 0);
        int updated = flashSaleProductMapper.update(null, wrapper);
        assertEquals(1, updated, "status-based update must resolve on the real column");

        FlashSaleProduct found = flashSaleProductMapper.selectById(FLASH_SALE_ID);
        assertEquals(0, found.getStatus(), "status must be reset to 0");
        assertEquals(0, found.getSoldCount(), "sold_count must be reset");
    }

    @Test
    void queryBySessionAndProduct_resolvesOnRealColumns() {
        flashSaleProductMapper.insert(buildFlashSaleProduct(FLASH_SALE_ID, 0, 0));

        long count = flashSaleProductMapper.selectCount(
            new LambdaQueryWrapper<FlashSaleProduct>()
                .eq(FlashSaleProduct::getSessionId, SESSION_ID)
                .eq(FlashSaleProduct::getProductId, PRODUCT_ID)
        );
        assertTrue(count >= 1, "session_id / product_id query must resolve on real columns");
    }
}

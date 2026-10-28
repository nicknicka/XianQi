package com.xx.xianqijava.contract;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** 验证父行夹具在真实 MySQL 上连续调用不会重复插入。 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ParentFixtureFactoryIT {

    private static final long BUYER_ID = 2_100_000_000_000_001L;
    private static final long SELLER_ID = 2_100_000_000_000_002L;
    private static final long CATEGORY_ID = 2_100_000_000_000_003L;
    private static final long PRODUCT_ID = 2_100_000_000_000_004L;
    private static final long ORDER_ID = 2_100_000_000_000_005L;
    private static final long ADMIN_ID = 2_100_000_000_000_006L;
    private static final long SHARE_ID = 2_100_000_000_000_007L;
    private static final long SESSION_ID = 2_100_000_000_000_008L;
    private static final long FLASH_SALE_ID = 2_100_000_000_000_009L;

    @Autowired
    private DataSource dataSource;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void setUp() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM flash_sale_product WHERE flash_sale_id = " + FLASH_SALE_ID);
            stmt.executeUpdate("DELETE FROM `order` WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM share_item WHERE share_id = " + SHARE_ID);
            stmt.executeUpdate("DELETE FROM flash_sale_session WHERE session_id = " + SESSION_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id IN (" + BUYER_ID + ", " + SELLER_ID + ")");
            stmt.executeUpdate("DELETE FROM admin WHERE admin_id = " + ADMIN_ID);
        }
    }

    @Test
    void repeatedCalls_doNotInsertDuplicateParents() throws Exception {
        seedAllParents();
        seedAllParents();

        assertOneRow("user", "user_id", BUYER_ID);
        assertOneRow("user", "user_id", SELLER_ID);
        assertOneRow("category", "category_id", CATEGORY_ID);
        assertOneRow("product", "product_id", PRODUCT_ID);
        assertOneRow("`order`", "order_id", ORDER_ID);
        assertOneRow("admin", "admin_id", ADMIN_ID);
        assertOneRow("share_item", "share_id", SHARE_ID);
        assertOneRow("flash_sale_session", "session_id", SESSION_ID);
        assertOneRow("flash_sale_product", "flash_sale_id", FLASH_SALE_ID);
    }

    private void seedAllParents() throws Exception {
        fixtures.user(BUYER_ID, "fixture_buyer", "13000000001");
        fixtures.user(SELLER_ID, "fixture_seller", "13000000002");
        fixtures.category(CATEGORY_ID, "夹具分类", "fixture_category");
        fixtures.product(PRODUCT_ID, SELLER_ID, CATEGORY_ID, "夹具商品", new BigDecimal("1.00"));
        fixtures.order(ORDER_ID, "FIXTURE_ORDER", BUYER_ID, SELLER_ID, PRODUCT_ID,
            new BigDecimal("1.00"));
        fixtures.admin(ADMIN_ID, "fixture_admin");
        fixtures.shareItem(SHARE_ID, SELLER_ID, CATEGORY_ID, "夹具共享物品");
        fixtures.flashSaleSession(SESSION_ID, "夹具场次");
        fixtures.flashSaleProduct(FLASH_SALE_ID, SESSION_ID, PRODUCT_ID, new BigDecimal("0.50"));
    }

    private void assertOneRow(String table, String idColumn, long id) throws Exception {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT COUNT(*) FROM " + table + " WHERE " + idColumn + " = ?")) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                assertEquals(1, rs.getLong(1), "fixture row must not be duplicated: " + table);
            }
        }
    }
}

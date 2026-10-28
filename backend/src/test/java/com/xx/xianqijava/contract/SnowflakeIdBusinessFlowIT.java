package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Product;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.mapper.CategoryMapper;
import com.xx.xianqijava.mapper.ProductMapper;
import com.xx.xianqijava.mapper.UserMapper;
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
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 关键业务流 seam 测试：分类创建 → 商品发布 → 用户创建
 * 验证雪花 ID 全链路不溢出、外键关联正确、ID 可往返查询。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers，
 * 因此本地与 CI 使用同一套连接契约，也不会再因 Docker API 握手失败而被静默跳过。
 * 每个测试使用带运行后缀的唯一值，并在结束后清理自己写入的数据。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SnowflakeIdBusinessFlowIT {

    /** 每次运行唯一的后缀，避免重复执行时命中唯一约束。 */
    static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final String CATEGORY_NAME = "测试分类";
    private static final String DIGITAL_CATEGORY_NAME = "数码电子";
    private static final BigDecimal PRICE = new BigDecimal("99.99");

    private static final String CATEGORY_CODE = "flow_" + RUN_ID + "_category";
    private static final String DIGITAL_CATEGORY_CODE = "flow_" + RUN_ID + "_digital";
    private static final String USER_NAME = "flow_" + RUN_ID + "_user";
    private static final String SELLER_NAME = "flow_" + RUN_ID + "_seller";
    private static final String USER_PHONE = "139" + RUN_ID;
    private static final String SELLER_PHONE = "138" + RUN_ID;
    private static final String LOCATION_PHONE = "137" + RUN_ID;
    private static final String PRODUCT_TITLE = "flow_" + RUN_ID + "_product";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ProductMapper productMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        // schema.sql 是结构真源；用真实基线建表，避免手写 DDL 与实体漂移。
        // 多个 IT 类共享同一初始化，见 TestSchemaSupport。
        fixtures = TestParentFixtureFactory.prepare(dataSource);
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM product WHERE title LIKE 'flow_" + RUN_ID + "_%'");
            stmt.executeUpdate("DELETE FROM category WHERE code LIKE 'flow_" + RUN_ID + "_%'");
            stmt.executeUpdate("DELETE FROM user WHERE username LIKE 'flow_" + RUN_ID + "_%'");
        }
    }

    @Test
    void category_snowflakeId_generatedAndQueryable() {
        var category = fixtures.getOrCreateCategory(categoryMapper, CATEGORY_NAME, CATEGORY_CODE);

        assertNotNull(category.getCategoryId(), "categoryId should be generated");
        assertTrue(category.getCategoryId() > 0, "categoryId should be positive");

        long jsSafeMax = (1L << 53) - 1;
        assertTrue(category.getCategoryId() > jsSafeMax,
            "categoryId should exceed JS safe integer max");

        var found = categoryMapper.selectById(category.getCategoryId());
        assertNotNull(found, "should find category by ID");
        assertEquals(category.getCategoryId(), found.getCategoryId());
        assertEquals(CATEGORY_NAME, found.getName());
    }

    @Test
    void user_snowflakeId_generatedAndQueryable() {
        User user = fixtures.getOrCreateUser(userMapper, USER_NAME, USER_PHONE, "测试用户", null);

        assertNotNull(user.getUserId(), "userId should be generated");

        long jsSafeMax = (1L << 53) - 1;
        assertTrue(user.getUserId() > jsSafeMax,
            "userId should exceed JS safe integer max");

        User found = userMapper.selectById(user.getUserId());
        assertNotNull(found);
        assertEquals(user.getUserId(), found.getUserId());
    }

    @Test
    void user_locationColumn_mapsToLocationDisplay() {
        User user = fixtures.getOrCreateUser(userMapper, USER_NAME + "_location", LOCATION_PHONE,
            "位置映射用户", "北京市海淀区");

        User found = userMapper.selectById(user.getUserId());
        assertNotNull(found, "selectById must not fail on the location column");
        assertEquals("北京市海淀区", found.getLocationDisplay());
    }

    @Test
    void product_withCategoryAndSeller_fullIdChain() {
        User seller = fixtures.getOrCreateUser(userMapper, SELLER_NAME, SELLER_PHONE, "卖家", null);
        var category = fixtures.getOrCreateCategory(categoryMapper, DIGITAL_CATEGORY_NAME,
            DIGITAL_CATEGORY_CODE);
        var product = fixtures.getOrCreateProduct(productMapper, seller.getUserId(),
            category.getCategoryId(), PRODUCT_TITLE, PRICE);

        assertNotNull(product.getProductId());
        long jsSafeMax = (1L << 53) - 1;
        assertTrue(product.getProductId() > jsSafeMax, "productId should exceed JS safe max");
        assertTrue(seller.getUserId() > jsSafeMax, "sellerId should exceed JS safe max");
        assertTrue(category.getCategoryId() > jsSafeMax, "categoryId should exceed JS safe max");

        var found = productMapper.selectById(product.getProductId());
        assertNotNull(found);
        assertEquals(seller.getUserId(), found.getSellerId(), "sellerId should match");
        assertEquals(category.getCategoryId(), found.getCategoryId(), "categoryId should match");

        long count = productMapper.selectCount(
            new LambdaQueryWrapper<Product>()
                .eq(Product::getSellerId, seller.getUserId())
        );
        assertTrue(count >= 1, "should find products by sellerId");
    }
}

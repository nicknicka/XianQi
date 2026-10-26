package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Category;
import com.xx.xianqijava.entity.Product;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.mapper.CategoryMapper;
import com.xx.xianqijava.mapper.ProductMapper;
import com.xx.xianqijava.mapper.UserMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 关键业务流 seam 测试：分类创建 → 商品发布 → 用户创建
 * 验证雪花 ID 全链路不溢出、外键关联正确、ID 可往返查询。
 *
 * 使用 Testcontainers MySQL。
 * 本地无 Docker 环境时自动跳过（CI 中会执行）。
 * 
 * 注意：测试类上加 @Testcontainers 后，如果 Docker 不可用，
 * 整个类会在测试启动时报错。因此用 @EnabledIfDockerAvailable
 * 或依赖 CI 环境变量控制。
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class SnowflakeIdBusinessFlowTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
        .withDatabaseName("Xianqi_test")
        .withUsername("test")
        .withPassword("test123456")
        .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.autoconfigure.exclude", () ->
            "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
            "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration");
    }

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ProductMapper productMapper;

    @BeforeAll
    static void initSchema() throws Exception {
        try (Connection conn = DriverManager.getConnection(
                mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
             Statement stmt = conn.createStatement()) {

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS user (
                    user_id BIGINT NOT NULL PRIMARY KEY,
                    username VARCHAR(50) NULL,
                    password VARCHAR(255) NOT NULL DEFAULT '',
                    nickname VARCHAR(50) NOT NULL DEFAULT '',
                    avatar VARCHAR(500) NULL,
                    phone VARCHAR(20) NOT NULL DEFAULT '',
                    status TINYINT NOT NULL DEFAULT 0,
                    credit_score INT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted TINYINT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS category (
                    category_id BIGINT NOT NULL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    code VARCHAR(50) NULL,
                    parent_id BIGINT NOT NULL DEFAULT 0,
                    sort_order INT NOT NULL DEFAULT 0,
                    status TINYINT NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted TINYINT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    product_id BIGINT NOT NULL PRIMARY KEY,
                    seller_id BIGINT NOT NULL,
                    title VARCHAR(200) NULL,
                    category_id BIGINT NULL,
                    price DECIMAL(10,2) NULL,
                    status TINYINT NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted TINYINT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
        }
    }

    @Test
    void category_snowflakeId_generatedAndQueryable() {
        Category category = new Category();
        category.setName("测试分类");
        category.setCode("test_category_flow");
        category.setStatus(1);
        categoryMapper.insert(category);

        assertNotNull(category.getCategoryId(), "categoryId should be generated");
        assertTrue(category.getCategoryId() > 0, "categoryId should be positive");

        long jsSafeMax = (1L << 53) - 1;
        assertTrue(category.getCategoryId() > jsSafeMax,
            "categoryId should exceed JS safe integer max");

        Category found = categoryMapper.selectById(category.getCategoryId());
        assertNotNull(found, "should find category by ID");
        assertEquals(category.getCategoryId(), found.getCategoryId());
        assertEquals("测试分类", found.getName());
    }

    @Test
    void user_snowflakeId_generatedAndQueryable() {
        User user = new User();
        user.setUsername("testuser_flow2");
        user.setPassword("testpass");
        user.setNickname("测试用户");
        user.setPhone("13800000010");
        userMapper.insert(user);

        assertNotNull(user.getUserId(), "userId should be generated");

        long jsSafeMax = (1L << 53) - 1;
        assertTrue(user.getUserId() > jsSafeMax,
            "userId should exceed JS safe integer max");

        User found = userMapper.selectById(user.getUserId());
        assertNotNull(found);
        assertEquals(user.getUserId(), found.getUserId());
    }

    @Test
    void product_withCategoryAndSeller_fullIdChain() {
        User seller = new User();
        seller.setUsername("seller_flow2");
        seller.setPassword("pass");
        seller.setNickname("卖家");
        seller.setPhone("13800000020");
        userMapper.insert(seller);

        Category category = new Category();
        category.setName("数码电子");
        category.setCode("digital_flow2");
        category.setStatus(1);
        categoryMapper.insert(category);

        Product product = new Product();
        product.setTitle("测试商品全链路");
        product.setSellerId(seller.getUserId());
        product.setCategoryId(category.getCategoryId());
        product.setPrice(new BigDecimal("99.99"));
        product.setStatus(1);
        productMapper.insert(product);

        assertNotNull(product.getProductId());
        long jsSafeMax = (1L << 53) - 1;
        assertTrue(product.getProductId() > jsSafeMax, "productId should exceed JS safe max");
        assertTrue(seller.getUserId() > jsSafeMax, "sellerId should exceed JS safe max");
        assertTrue(category.getCategoryId() > jsSafeMax, "categoryId should exceed JS safe max");

        Product found = productMapper.selectById(product.getProductId());
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

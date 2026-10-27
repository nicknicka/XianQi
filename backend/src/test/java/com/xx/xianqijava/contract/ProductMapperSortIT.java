package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xx.xianqijava.entity.Category;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 商品列表排序必须在真实 schema 上返回正确顺序（外部行为，不断言 SQL 文本）。
 *
 * <p>回归 issue #25 / #24：默认排序与距离排序曾按已删除的 {@code create_time} 列排序。
 * 本测试在真实 MySQL 上插入 created_at / price 各不相同的商品，断言查询结果的
 * 实际排序，而不是 SQL 字符串。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ProductMapperSortIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long SELLER_ID = 5_100_000_000_000_001L;
    private static final Long CATEGORY_ID = 5_200_000_000_000_001L;
    private static final Long CHEAPEST_OLDEST = 5_300_000_000_000_001L;
    private static final Long MIDDLE = 5_400_000_000_000_001L;
    private static final Long PRICIEST_NEWEST = 5_500_000_000_000_001L;

    private static final String TITLE_PREFIX = "sort_" + RUN_ID + "_";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ProductMapper productMapper;

    @BeforeAll
    void initSchema() throws Exception {
        TestSchemaSupport.ensureSchema(dataSource);

        User seller = new User();
        seller.setUserId(SELLER_ID);
        seller.setUsername("sort_" + RUN_ID);
        seller.setPassword("testpass");
        seller.setNickname("排序契约卖家");
        seller.setPhone("134" + RUN_ID);
        userMapper.insert(seller);

        Category category = new Category();
        category.setCategoryId(CATEGORY_ID);
        category.setName("排序契约分类");
        category.setCode("sort_" + RUN_ID);
        category.setStatus(1);
        categoryMapper.insert(category);

        // created_at 与 price 刻意反向，区分按时间排序与按价格排序。
        insertProduct(CHEAPEST_OLDEST, "最旧最便宜", "10.00", LocalDateTime.now().minusDays(3));
        insertProduct(MIDDLE, "中间", "20.00", LocalDateTime.now().minusDays(2));
        insertProduct(PRICIEST_NEWEST, "最新最贵", "30.00", LocalDateTime.now().minusDays(1));
    }

    private void insertProduct(Long productId, String label, String price, LocalDateTime createdAt) {
        Product product = new Product();
        product.setProductId(productId);
        product.setSellerId(SELLER_ID);
        product.setCategoryId(CATEGORY_ID);
        product.setTitle(TITLE_PREFIX + label);
        product.setPrice(new BigDecimal(price));
        product.setStatus(1);
        product.setCreatedAt(createdAt);
        productMapper.insert(product);
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM product WHERE title LIKE '" + TITLE_PREFIX + "%'");
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id = " + SELLER_ID);
        }
    }

    /** 只取本测试写入的三条记录，按查询返回顺序映射为商品ID。 */
    private List<Long> orderedIds(String sortBy, Boolean priceAsc) {
        Page<Product> page = new Page<>(1, 20);
        return productMapper.selectProductPage(page, null, 1, TITLE_PREFIX, sortBy, priceAsc)
                .getRecords().stream()
                .map(Product::getProductId)
                .toList();
    }

    @Test
    void defaultSort_ordersByCreatedAtDescending() {
        assertEquals(List.of(PRICIEST_NEWEST, MIDDLE, CHEAPEST_OLDEST), orderedIds(null, null),
            "默认排序必须按 created_at 倒序（最新在前）");
    }

    @Test
    void distanceSort_ordersByCreatedAtDescending() {
        assertEquals(List.of(PRICIEST_NEWEST, MIDDLE, CHEAPEST_OLDEST), orderedIds("distance", null),
            "距离排序当前以 created_at 倒序代替");
    }

    @Test
    void priceSortAscending_ordersByPriceAscending() {
        assertEquals(List.of(CHEAPEST_OLDEST, MIDDLE, PRICIEST_NEWEST), orderedIds("price", true),
            "价格升序必须按 price 升序返回");
    }

    @Test
    void priceSortDescending_ordersByPriceDescending() {
        assertEquals(List.of(PRICIEST_NEWEST, MIDDLE, CHEAPEST_OLDEST), orderedIds("price", false),
            "价格降序必须按 price 降序返回");
    }
}

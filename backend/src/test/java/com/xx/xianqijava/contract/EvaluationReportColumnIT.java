package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Category;
import com.xx.xianqijava.entity.Evaluation;
import com.xx.xianqijava.entity.Order;
import com.xx.xianqijava.entity.Product;
import com.xx.xianqijava.entity.Report;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.mapper.CategoryMapper;
import com.xx.xianqijava.mapper.EvaluationMapper;
import com.xx.xianqijava.mapper.OrderMapper;
import com.xx.xianqijava.mapper.ProductMapper;
import com.xx.xianqijava.mapper.ReportMapper;
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
 * 评价与举报实体必须在真实 schema 上完成 insert → select 往返。
 *
 * <p>回归 issue #28：评价的字段曾与 {@code evaluation} 表错位
 * （evalId / fromUserId / toUserId / score，缺少 product_id），举报实体曾用
 * 用户中心的 {@code reportedUserId / conversationId / messageId / adminNote}
 * 对接多态的 {@code report} 表（target_type / target_id / handler_id / handle_note），
 * 两处都会在真实库上报 Unknown column。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 * 每个测试使用带运行后缀的唯一值并在结束后清理自己写入的数据。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EvaluationReportColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long EVALUATION_ID = 9_100_000_000_000_001L;
    private static final Long REPORT_ID = 9_200_000_000_000_001L;
    private static final Long ORDER_ID = 9_300_000_000_000_001L;
    private static final Long PRODUCT_ID = 9_400_000_000_000_001L;
    private static final Long BUYER_ID = 9_500_000_000_000_001L;
    private static final Long SELLER_ID = 9_600_000_000_000_001L;
    private static final Long CATEGORY_ID = 9_700_000_000_000_001L;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private EvaluationMapper evaluationMapper;

    @Autowired
    private ReportMapper reportMapper;

    @BeforeAll
    void initSchema() throws Exception {
        TestSchemaSupport.ensureSchema(dataSource);
        seedParentRows();
    }

    private void seedParentRows() {
        Category category = new Category();
        category.setCategoryId(CATEGORY_ID);
        category.setName("列名契约分类");
        category.setCode("col_contract_" + RUN_ID);
        category.setStatus(1);
        categoryMapper.insert(category);

        userMapper.insert(buildUser(BUYER_ID, "col_buyer_" + RUN_ID, "138" + RUN_ID));
        userMapper.insert(buildUser(SELLER_ID, "col_seller_" + RUN_ID, "139" + RUN_ID));

        Product product = new Product();
        product.setProductId(PRODUCT_ID);
        product.setSellerId(SELLER_ID);
        product.setCategoryId(CATEGORY_ID);
        product.setTitle("列名契约商品 " + RUN_ID);
        product.setPrice(new BigDecimal("9.99"));
        productMapper.insert(product);

        Order order = new Order();
        order.setOrderId(ORDER_ID);
        order.setOrderNo("COL" + RUN_ID);
        order.setBuyerId(BUYER_ID);
        order.setSellerId(SELLER_ID);
        order.setProductId(PRODUCT_ID);
        order.setType(1);
        order.setAmount(new BigDecimal("9.99"));
        orderMapper.insert(order);
    }

    private User buildUser(Long userId, String username, String phone) {
        User user = new User();
        user.setUserId(userId);
        user.setUsername(username);
        user.setPassword("testpass");
        user.setNickname(username);
        user.setPhone(phone);
        return user;
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM evaluation WHERE evaluation_id IN (" + EVALUATION_ID + ", " + (EVALUATION_ID + 2) + ")");
            stmt.executeUpdate("DELETE FROM report WHERE report_id IN (" + REPORT_ID + ", " + (REPORT_ID + 1) + ")");
            stmt.executeUpdate("DELETE FROM `order` WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id IN (" + BUYER_ID + ", " + SELLER_ID + ")");
        }
    }

    @Test
    void evaluation_insertAndSelect_roundTripsSchemaColumns() {
        Evaluation evaluation = new Evaluation();
        evaluation.setEvaluationId(EVALUATION_ID);
        evaluation.setOrderId(ORDER_ID);
        evaluation.setProductId(PRODUCT_ID);
        evaluation.setEvaluatorId(BUYER_ID);
        evaluation.setTargetUserId(SELLER_ID);
        evaluation.setRating(5);
        evaluation.setContent("列名契约冒烟 " + RUN_ID);
        evaluationMapper.insert(evaluation);

        Evaluation found = evaluationMapper.selectById(EVALUATION_ID);
        assertNotNull(found, "selectById must not fail on the evaluation columns");
        assertEquals(ORDER_ID, found.getOrderId());
        assertEquals(PRODUCT_ID, found.getProductId());
        assertEquals(BUYER_ID, found.getEvaluatorId());
        assertEquals(SELLER_ID, found.getTargetUserId());
        assertEquals(5, found.getRating());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");

        long count = evaluationMapper.selectCount(
            new LambdaQueryWrapper<Evaluation>()
                .eq(Evaluation::getTargetUserId, SELLER_ID)
                .ge(Evaluation::getRating, 4)
        );
        assertTrue(count >= 1, "target_user_id / rating query must resolve on real columns");
    }

    @Test
    void report_insertAndSelect_roundTripsPolymorphicColumns() {
        Report report = new Report();
        report.setReportId(REPORT_ID);
        report.setReporterId(BUYER_ID);
        report.setTargetType("user");
        report.setTargetId(SELLER_ID);
        report.setReason("欺诈");
        report.setDescription("列名契约冒烟 " + RUN_ID);
        report.setType(1);
        report.setStatus(0);
        reportMapper.insert(report);

        Report found = reportMapper.selectById(REPORT_ID);
        assertNotNull(found, "selectById must not fail on the report columns");
        assertEquals(BUYER_ID, found.getReporterId());
        assertEquals("user", found.getTargetType());
        assertEquals(SELLER_ID, found.getTargetId());
        assertEquals(1, found.getType());
        assertEquals(0, found.getStatus());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void report_targetTypeQuery_worksOnRealColumns() {
        Report report = new Report();
        report.setReportId(REPORT_ID + 1);
        report.setReporterId(BUYER_ID);
        report.setTargetType("product");
        report.setTargetId(PRODUCT_ID);
        report.setReason("虚假信息");
        report.setStatus(0);
        reportMapper.insert(report);

        long count = reportMapper.selectCount(
            new LambdaQueryWrapper<Report>()
                .eq(Report::getTargetType, "product")
                .eq(Report::getTargetId, PRODUCT_ID)
        );
        assertTrue(count >= 1, "target_type/target_id query must resolve on real columns");
    }
}

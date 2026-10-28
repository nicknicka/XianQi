package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Evaluation;
import com.xx.xianqijava.entity.Report;
import com.xx.xianqijava.mapper.EvaluationMapper;
import com.xx.xianqijava.mapper.ReportMapper;
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
    private EvaluationMapper evaluationMapper;

    @Autowired
    private ReportMapper reportMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        seedParentRows();
    }

    private void seedParentRows() throws Exception {
        fixtures.category(CATEGORY_ID, "列名契约分类", "col_contract_" + RUN_ID);
        fixtures.user(BUYER_ID, "col_buyer_" + RUN_ID, "138" + RUN_ID);
        fixtures.user(SELLER_ID, "col_seller_" + RUN_ID, "139" + RUN_ID);
        fixtures.product(PRODUCT_ID, SELLER_ID, CATEGORY_ID,
            "列名契约商品 " + RUN_ID, new BigDecimal("9.99"));
        fixtures.order(ORDER_ID, "COL" + RUN_ID, BUYER_ID, SELLER_ID, PRODUCT_ID,
            new BigDecimal("9.99"));
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

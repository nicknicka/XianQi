package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Blacklist;
import com.xx.xianqijava.entity.FlashSaleOrderExt;
import com.xx.xianqijava.entity.FlashSaleSession;
import com.xx.xianqijava.entity.QuickReply;
import com.xx.xianqijava.entity.UserFollow;
import com.xx.xianqijava.mapper.BlacklistMapper;
import com.xx.xianqijava.mapper.FlashSaleOrderExtMapper;
import com.xx.xianqijava.mapper.FlashSaleSessionMapper;
import com.xx.xianqijava.mapper.QuickReplyMapper;
import com.xx.xianqijava.mapper.UserFollowMapper;
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
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 聊天/关注/黑名单/秒杀实体必须在真实 schema 上完成 insert → select 往返。
 *
 * <p>回归 issue #31：QuickReply 缺 {@code updated_at}、FlashSaleSession 用
 * {@code enabled} 而非 schema 的 {@code status} 且缺 {@code updated_at}、
 * FlashSaleOrderExt 主键用 {@code id}（schema 为 {@code ext_id}）且场次外键用
 * {@code sessionId}（schema 为 {@code flash_sale_id}）并带了不存在的 {@code updated_at}。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SocialFlashSaleColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long USER_A = 6_100_000_000_000_001L;
    private static final Long USER_B = 6_200_000_000_000_001L;
    private static final Long CATEGORY_ID = 6_300_000_000_000_001L;
    private static final Long PRODUCT_ID = 6_400_000_000_000_001L;
    private static final Long SESSION_ID = 6_500_000_000_000_001L;
    private static final Long FLASH_SALE_ID = 6_600_000_000_000_001L;
    private static final Long ORDER_ID = 6_700_000_000_000_001L;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private FlashSaleOrderExtMapper flashSaleOrderExtMapper;

    @Autowired
    private FlashSaleSessionMapper flashSaleSessionMapper;

    @Autowired
    private QuickReplyMapper quickReplyMapper;

    @Autowired
    private UserFollowMapper userFollowMapper;

    @Autowired
    private BlacklistMapper blacklistMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        fixtures.user(USER_A, "sf_a_" + RUN_ID, "136" + RUN_ID);
        fixtures.user(USER_B, "sf_b_" + RUN_ID, "135" + RUN_ID);
        fixtures.category(CATEGORY_ID, "秒杀契约分类", "sf_" + RUN_ID);
        fixtures.product(PRODUCT_ID, USER_A, CATEGORY_ID,
            "秒杀契约商品 " + RUN_ID, new BigDecimal("50.00"));
        fixtures.flashSaleSession(SESSION_ID, "秒杀契约场次 " + RUN_ID);

        // FlashSaleProduct 自身的列名漂移不在 #31 范围；这里只补一条满足外键的父行。
        fixtures.flashSaleProduct(FLASH_SALE_ID, SESSION_ID, PRODUCT_ID,
            new BigDecimal("25.00"));
        fixtures.order(ORDER_ID, "SF" + RUN_ID, USER_B, USER_A, PRODUCT_ID,
            new BigDecimal("25.00"));
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM quick_reply WHERE user_id = " + USER_A);
            stmt.executeUpdate("DELETE FROM user_follow WHERE follower_id = " + USER_A);
            stmt.executeUpdate("DELETE FROM blacklist WHERE user_id = " + USER_A);
            stmt.executeUpdate("DELETE FROM flash_sale_order_ext WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM `order` WHERE order_id = " + ORDER_ID);
            stmt.executeUpdate("DELETE FROM flash_sale_product WHERE flash_sale_id = " + FLASH_SALE_ID);
            stmt.executeUpdate("DELETE FROM flash_sale_session WHERE session_id = " + SESSION_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id IN (" + USER_A + ", " + USER_B + ")");
        }
    }

    @Test
    void quickReply_insertAndSelect_roundTripsSchemaColumns() {
        QuickReply reply = new QuickReply();
        reply.setUserId(USER_A);
        reply.setContent("列名契约快捷回复 " + RUN_ID);
        reply.setCategory("其他");
        reply.setSortOrder(0);
        reply.setIsSystem(0);
        quickReplyMapper.insert(reply);

        assertNotNull(reply.getReplyId(), "reply_id should be generated on insert");
        QuickReply found = quickReplyMapper.selectById(reply.getReplyId());
        assertNotNull(found, "selectById must not fail on the quick_reply columns");
        assertEquals(USER_A, found.getUserId());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
        assertNotNull(found.getUpdatedAt(), "updated_at should be auto-filled on insert");
    }

    @Test
    void userFollow_insertAndSelect_roundTripsSchemaColumns() {
        UserFollow follow = new UserFollow();
        follow.setFollowerId(USER_A);
        follow.setFollowingId(USER_B);
        userFollowMapper.insert(follow);

        assertNotNull(follow.getFollowId(), "follow_id should be generated on insert");
        long count = userFollowMapper.selectCount(
            new LambdaQueryWrapper<UserFollow>()
                .eq(UserFollow::getFollowerId, USER_A)
                .eq(UserFollow::getFollowingId, USER_B)
        );
        assertTrue(count >= 1, "follower_id / following_id query must resolve on real columns");
    }

    @Test
    void blacklist_insertAndSelect_roundTripsSchemaColumns() {
        Blacklist blacklist = new Blacklist();
        blacklist.setUserId(USER_A);
        blacklist.setBlockedUserId(USER_B);
        blacklist.setReason("列名契约");
        blacklistMapper.insert(blacklist);

        assertNotNull(blacklist.getBlacklistId(), "blacklist_id should be generated on insert");
        Blacklist found = blacklistMapper.selectById(blacklist.getBlacklistId());
        assertNotNull(found, "selectById must not fail on the blacklist columns");
        assertEquals(USER_B, found.getBlockedUserId());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void flashSaleSession_statusColumn_roundTrips() {
        FlashSaleSession found = flashSaleSessionMapper.selectById(SESSION_ID);
        assertNotNull(found, "selectById must not fail on the flash_sale_session columns");
        assertEquals(1, found.getStatus(), "status column must be readable");
        assertNotNull(found.getUpdatedAt(), "updated_at should be present on the session row");

        // 启用场次查询（业务主路径）必须命中真实 status 列
        long enabledSessions = flashSaleSessionMapper.selectCount(
            new LambdaQueryWrapper<FlashSaleSession>()
                .eq(FlashSaleSession::getStatus, 1)
                .eq(FlashSaleSession::getSessionId, SESSION_ID)
        );
        assertEquals(1, enabledSessions, "status query must resolve on the real status column");
    }

    @Test
    void flashSaleOrderExt_usesExtIdAndFlashSaleIdColumns() {
        FlashSaleOrderExt ext = new FlashSaleOrderExt();
        ext.setOrderId(ORDER_ID);
        ext.setUserId(USER_B);
        ext.setProductId(PRODUCT_ID);
        ext.setFlashSaleId(FLASH_SALE_ID);
        ext.setFlashPrice(new BigDecimal("25.00"));
        ext.setSeckillTime(LocalDateTime.now());
        flashSaleOrderExtMapper.insert(ext);

        assertNotNull(ext.getExtId(), "ext_id should be generated on insert");
        FlashSaleOrderExt found = flashSaleOrderExtMapper.selectById(ext.getExtId());
        assertNotNull(found, "selectById must not fail on the flash_sale_order_ext columns");
        assertEquals(FLASH_SALE_ID, found.getFlashSaleId(), "flash_sale_id must round-trip");
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");

        long count = flashSaleOrderExtMapper.selectCount(
            new LambdaQueryWrapper<FlashSaleOrderExt>()
                .eq(FlashSaleOrderExt::getUserId, USER_B)
                .eq(FlashSaleOrderExt::getFlashSaleId, FLASH_SALE_ID)
        );
        assertTrue(count >= 1, "flash_sale_id query must resolve on the real column");
    }
}

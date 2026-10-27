package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.ProductFavorite;
import com.xx.xianqijava.entity.ProductImage;
import com.xx.xianqijava.entity.ProductStatistics;
import com.xx.xianqijava.entity.ShareItemImage;
import com.xx.xianqijava.mapper.ProductFavoriteMapper;
import com.xx.xianqijava.mapper.ProductImageMapper;
import com.xx.xianqijava.mapper.ProductStatisticsMapper;
import com.xx.xianqijava.mapper.ShareItemImageMapper;
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
 * 商品/共享附属实体必须在真实 schema 上完成 insert → select 往返。
 *
 * <p>回归 issue #30：ProductImage 曾带 schema 不存在的 {@code height} 列，
 * ProductStatistics 曾把 {@code product_id} 当作 {@code @TableId} 而忽略
 * schema 的主键 {@code stat_id}，两者都会在真实库上报 Unknown column。
 *
 * <p>复用测试环境提供的 MySQL（{@code MYSQL_URL}），不启动 Testcontainers。
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ProductAttachmentColumnIT {

    private static final String RUN_ID = String.format("%08d",
        Math.abs(ThreadLocalRandom.current().nextLong(100_000_000)));

    private static final Long USER_ID = 7_100_000_000_000_001L;
    private static final Long CATEGORY_ID = 7_200_000_000_000_001L;
    private static final Long PRODUCT_ID = 7_300_000_000_000_001L;
    private static final Long PRODUCT_IMAGE_ID = 7_400_000_000_000_001L;
    private static final Long SHARE_IMAGE_ID = 7_500_000_000_000_001L;
    private static final Long SHARE_ID = 7_600_000_000_000_001L;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private ProductImageMapper productImageMapper;

    @Autowired
    private ShareItemImageMapper shareItemImageMapper;

    @Autowired
    private ProductFavoriteMapper productFavoriteMapper;

    @Autowired
    private ProductStatisticsMapper productStatisticsMapper;

    private TestParentFixtureFactory fixtures;

    @BeforeAll
    void initSchema() throws Exception {
        fixtures = TestParentFixtureFactory.prepare(dataSource);
        fixtures.user(USER_ID, "col_pa_" + RUN_ID, "137" + RUN_ID);
        fixtures.category(CATEGORY_ID, "附属契约分类", "pa_" + RUN_ID);
        fixtures.product(PRODUCT_ID, USER_ID, CATEGORY_ID,
            "附属契约商品 " + RUN_ID, new BigDecimal("1.00"));

        // share_item_image.share_id 有外键指向 share_item
        fixtures.shareItem(SHARE_ID, USER_ID, CATEGORY_ID, "附属契约共享 " + RUN_ID);
    }

    @AfterAll
    void cleanUp() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM product_favorite WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM product_statistics WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM product_image WHERE image_id = " + PRODUCT_IMAGE_ID);
            stmt.executeUpdate("DELETE FROM share_item_image WHERE image_id = " + SHARE_IMAGE_ID);
            stmt.executeUpdate("DELETE FROM share_item WHERE share_id = " + SHARE_ID);
            stmt.executeUpdate("DELETE FROM product WHERE product_id = " + PRODUCT_ID);
            stmt.executeUpdate("DELETE FROM category WHERE category_id = " + CATEGORY_ID);
            stmt.executeUpdate("DELETE FROM user WHERE user_id = " + USER_ID);
        }
    }

    @Test
    void productImage_insertAndSelect_roundTripsSchemaColumns() {
        ProductImage image = new ProductImage();
        image.setImageId(PRODUCT_IMAGE_ID);
        image.setProductId(PRODUCT_ID);
        image.setImageUrl("https://example.test/" + RUN_ID + ".jpg");
        image.setImageThumbnailUrl("https://example.test/" + RUN_ID + "_thumb.jpg");
        image.setSortOrder(0);
        image.setWidth(800);
        image.setIsCover(1);
        image.setStatus(0);
        productImageMapper.insert(image);

        ProductImage found = productImageMapper.selectById(PRODUCT_IMAGE_ID);
        assertNotNull(found, "selectById must not fail on product_image columns");
        assertEquals(PRODUCT_ID, found.getProductId());
        assertEquals(800, found.getWidth());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void shareItemImage_insertAndSelect_keepsHeightColumn() {
        ShareItemImage image = new ShareItemImage();
        image.setImageId(SHARE_IMAGE_ID);
        image.setShareId(SHARE_ID);
        image.setImageUrl("https://example.test/share_" + RUN_ID + ".jpg");
        image.setWidth(640);
        image.setHeight(480);
        image.setStatus(0);
        shareItemImageMapper.insert(image);

        ShareItemImage found = shareItemImageMapper.selectById(SHARE_IMAGE_ID);
        assertNotNull(found, "selectById must not fail on share_item_image columns");
        assertEquals(SHARE_ID, found.getShareId());
        assertEquals(480, found.getHeight(), "share_item_image has a real height column");
    }

    @Test
    void productStatistics_insertAndSelect_usesStatIdPrimaryKey() {
        ProductStatistics statistics = new ProductStatistics();
        statistics.setProductId(PRODUCT_ID);
        statistics.setViewCount(3);
        statistics.setFavoriteCount(1);
        statistics.setImageCount(1);
        productStatisticsMapper.insert(statistics);

        assertNotNull(statistics.getStatId(), "stat_id should be generated on insert");

        ProductStatistics found = productStatisticsMapper.selectById(statistics.getStatId());
        assertNotNull(found, "selectById must not fail on product_statistics columns");
        assertEquals(PRODUCT_ID, found.getProductId());
        assertEquals(3, found.getViewCount());
        assertNotNull(found.getCreatedAt(), "created_at should be auto-filled on insert");
    }

    @Test
    void productFavorite_insertAndSelect_roundTripsSchemaColumns() {
        ProductFavorite favorite = new ProductFavorite();
        favorite.setUserId(USER_ID);
        favorite.setProductId(PRODUCT_ID);
        productFavoriteMapper.insert(favorite);

        assertNotNull(favorite.getFavoriteId(), "favorite_id should be generated on insert");
        long count = productFavoriteMapper.selectCount(
            new LambdaQueryWrapper<ProductFavorite>()
                .eq(ProductFavorite::getUserId, USER_ID)
                .eq(ProductFavorite::getProductId, PRODUCT_ID)
        );
        assertTrue(count >= 1, "user_id / product_id query must resolve on real columns");
    }
}

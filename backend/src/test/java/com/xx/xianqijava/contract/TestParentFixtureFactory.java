package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xx.xianqijava.entity.Category;
import com.xx.xianqijava.entity.Product;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.mapper.CategoryMapper;
import com.xx.xianqijava.mapper.ProductMapper;
import com.xx.xianqijava.mapper.UserMapper;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;

/**
 * 真实库集成测试的外键父行夹具工厂。
 *
 * <p>新增 IT 必须通过本工厂创建用户、分类、商品、订单等父行，不要在测试类中重复
 * {@code new} 实体并手工补齐 schema 的必填列；schema 变化时只需修改本类。
 *
 * <p>固定 ID 方法按预留高位 ID upsert，连续调用不会报错或产生重复行。
 */
final class TestParentFixtureFactory {

    private final DataSource dataSource;

    private TestParentFixtureFactory(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** 初始化 schema 并创建夹具工厂；测试类应在 {@code @BeforeAll} 中调用。 */
    static TestParentFixtureFactory prepare(DataSource dataSource) throws Exception {
        TestSchemaSupport.ensureSchema(dataSource);
        return new TestParentFixtureFactory(dataSource);
    }

    /** 创建（或复用）由 MyBatis-Plus 生成雪花 ID 的用户，保持生成 ID 链路可验证。 */
    User getOrCreateUser(UserMapper userMapper, String username, String phone, String nickname,
                         String locationDisplay) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setPassword("testpass");
            user.setNickname(nickname);
            user.setPhone(phone);
            user.setLocationDisplay(locationDisplay);
            userMapper.insert(user);
            return user;
        }
        if (locationDisplay != null && !locationDisplay.equals(user.getLocationDisplay())) {
            user.setLocationDisplay(locationDisplay);
            userMapper.updateById(user);
        }
        return user;
    }

    /** 创建（或复用）由 MyBatis-Plus 生成雪花 ID 的分类。 */
    Category getOrCreateCategory(CategoryMapper categoryMapper, String name, String code) {
        Category category = categoryMapper.selectOne(
            new LambdaQueryWrapper<Category>().eq(Category::getCode, code));
        if (category != null) {
            return category;
        }
        category = new Category();
        category.setName(name);
        category.setCode(code);
        category.setStatus(1);
        categoryMapper.insert(category);
        return category;
    }

    /** 创建（或复用）由 MyBatis-Plus 生成雪花 ID 的商品。 */
    Product getOrCreateProduct(ProductMapper productMapper, long sellerId, long categoryId,
                               String title, BigDecimal price) {
        Product product = productMapper.selectOne(
            new LambdaQueryWrapper<Product>().eq(Product::getTitle, title));
        if (product != null) {
            return product;
        }
        product = new Product();
        product.setSellerId(sellerId);
        product.setCategoryId(categoryId);
        product.setTitle(title);
        product.setPrice(price);
        product.setStatus(1);
        productMapper.insert(product);
        return product;
    }

    void user(long userId, String username, String phone) throws SQLException {
        execute("""
            INSERT INTO `user` (user_id, username, password, nickname, phone)
            VALUES (?, ?, 'testpass', ?, ?)
            ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password),
                                    nickname = VALUES(nickname), phone = VALUES(phone)
            """, userId, username, username, phone);
    }

    void category(long categoryId, String name, String code) throws SQLException {
        execute("""
            INSERT INTO category (category_id, name, code, parent_id, status)
            VALUES (?, ?, ?, NULL, 1)
            ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code), status = VALUES(status)
            """, categoryId, name, code);
    }

    void product(long productId, long sellerId, long categoryId, String title, BigDecimal price)
        throws SQLException {
        product(productId, sellerId, categoryId, title, price, LocalDateTime.now());
    }

    void product(long productId, long sellerId, long categoryId, String title, BigDecimal price,
                 LocalDateTime createdAt) throws SQLException {
        execute("""
            INSERT INTO product (product_id, seller_id, title, category_id, price, status, audit_status, created_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?)
            ON DUPLICATE KEY UPDATE seller_id = VALUES(seller_id), title = VALUES(title),
                                    category_id = VALUES(category_id), price = VALUES(price),
                                    status = VALUES(status), audit_status = VALUES(audit_status),
                                    created_at = VALUES(created_at)
            """, productId, sellerId, title, categoryId, price, createdAt);
    }

    void order(long orderId, String orderNo, long buyerId, long sellerId, long productId,
               BigDecimal amount) throws SQLException {
        execute("""
            INSERT INTO `order` (order_id, order_no, buyer_id, seller_id, product_id, type, amount)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE order_no = VALUES(order_no), buyer_id = VALUES(buyer_id),
                                    seller_id = VALUES(seller_id), product_id = VALUES(product_id),
                                    type = VALUES(type), amount = VALUES(amount)
            """, orderId, orderNo, buyerId, sellerId, productId, amount);
    }

    void admin(long adminId, String username) throws SQLException {
        execute("""
            INSERT INTO admin (admin_id, username, password, nickname, is_active)
            VALUES (?, ?, 'bcrypt-placeholder', ?, 1)
            ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password),
                                    nickname = VALUES(nickname), is_active = VALUES(is_active)
            """, adminId, username, username);
    }

    void shareItem(long shareId, long ownerId, long categoryId, String title) throws SQLException {
        execute("""
            INSERT INTO share_item (share_id, owner_id, title, category_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE owner_id = VALUES(owner_id), title = VALUES(title),
                                    category_id = VALUES(category_id)
            """, shareId, ownerId, title, categoryId);
    }

    void flashSaleSession(long sessionId, String name) throws SQLException {
        LocalDateTime now = LocalDateTime.now();
        execute("""
            INSERT INTO flash_sale_session (session_id, name, start_time, end_time, session_type, status)
            VALUES (?, ?, ?, ?, 2, 1)
            ON DUPLICATE KEY UPDATE name = VALUES(name), start_time = VALUES(start_time),
                                    end_time = VALUES(end_time), session_type = VALUES(session_type),
                                    status = VALUES(status)
            """, sessionId, name, now.minusHours(1), now.plusHours(1));
    }

    void flashSaleProduct(long flashSaleId, long sessionId, long productId, BigDecimal flashPrice)
        throws SQLException {
        execute("""
            INSERT INTO flash_sale_product (flash_sale_id, session_id, product_id, flash_price)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), product_id = VALUES(product_id),
                                    flash_price = VALUES(flash_price)
            """, flashSaleId, sessionId, productId, flashPrice);
    }

    private void execute(String sql, Object... parameters) throws SQLException {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < parameters.length; i++) {
                stmt.setObject(i + 1, parameters[i]);
            }
            stmt.executeUpdate();
        }
    }
}

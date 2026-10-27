package com.xx.xianqijava.mapper;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ProductMapper.xml 的商品列表排序必须使用 schema 真实列名 {@code created_at}。
 *
 * <p>历史缺陷：默认排序与距离排序分支仍写 {@code ORDER BY create_time DESC}，
 * 而 schema.sql 的 product 表只有 {@code created_at}，导致商品列表查询报
 * Unknown column 'create_time'。见 issue #25。
 */
class ProductMapperOrderTest {

    private static final String STATEMENT =
        "com.xx.xianqijava.mapper.ProductMapper.selectProductPage";

    private String sqlFor(String sortBy) throws Exception {
        Configuration configuration = new Configuration();
        try (InputStream in = Resources.getResourceAsStream("mapper/ProductMapper.xml")) {
            XMLMapperBuilder builder = new XMLMapperBuilder(
                in, configuration, "mapper/ProductMapper.xml", configuration.getSqlFragments());
            builder.parse();
        }
        MappedStatement statement = configuration.getMappedStatement(STATEMENT);

        Map<String, Object> params = new HashMap<>();
        params.put("categoryId", null);
        params.put("status", 1);
        params.put("keyword", null);
        params.put("sortBy", sortBy);
        params.put("priceAsc", null);

        BoundSql boundSql = statement.getBoundSql(params);
        return boundSql.getSql();
    }

    @Test
    void defaultSortOrdersByCreatedAt() throws Exception {
        String sql = sqlFor(null);
        assertFalse(sql.contains("create_time"),
            "product list must not reference removed column create_time; sql=" + sql);
        assertTrue(sql.contains("ORDER BY created_at DESC"),
            "default sort must order by schema column created_at; sql=" + sql);
    }

    @Test
    void distanceSortOrdersByCreatedAt() throws Exception {
        String sql = sqlFor("distance");
        assertFalse(sql.contains("create_time"),
            "product list must not reference removed column create_time; sql=" + sql);
        assertTrue(sql.contains("ORDER BY created_at DESC"),
            "distance sort must order by schema column created_at; sql=" + sql);
    }
}

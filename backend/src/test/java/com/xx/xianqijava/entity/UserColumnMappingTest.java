package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * User 实体的列映射必须与 sql/schema.sql 对齐。
 *
 * <p>历史缺陷：{@code locationDisplay} 未显式声明列名，MyBatis-Plus 推断为
 * {@code location_display}，而 schema 中该列名为 {@code location}，导致
 * 任何用户查询都报 Unknown column。见 issue #41。
 */
class UserColumnMappingTest {

    @Test
    void locationDisplayMapsToLocationColumn() {
        TableInfoHelper.initTableInfo(
            new MapperBuilderAssistant(new MybatisConfiguration(), ""),
            User.class);

        TableInfo info = TableInfoHelper.getTableInfo(User.class);
        assertNotNull(info, "User table metadata must be initializable");

        Set<String> columns = new LinkedHashSet<>();
        columns.add(info.getKeyColumn());
        info.getFieldList().forEach(field -> columns.add(field.getColumn()));

        assertTrue(columns.contains("location"),
            "locationDisplay must map to schema column `location`; resolved=" + columns);
        assertFalse(columns.contains("location_display"),
            "`location_display` does not exist in schema.sql; resolved=" + columns);
    }
}

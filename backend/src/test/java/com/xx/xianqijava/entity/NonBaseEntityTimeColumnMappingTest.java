package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 非 BaseEntity 实体的时间字段列映射必须与 sql/schema.sql 对齐。
 */
class NonBaseEntityTimeColumnMappingTest {

    @ParameterizedTest(name = "{0}")
    @MethodSource("entityTimeColumnCases")
    void timeFieldsMapToSchemaColumns(Class<?> entityClass, Set<String> expectedTimeColumns) {
        TableInfoHelper.initTableInfo(
            new MapperBuilderAssistant(new MybatisConfiguration(), ""),
            entityClass);

        TableInfo info = TableInfoHelper.getTableInfo(entityClass);
        assertNotNull(info, entityClass.getSimpleName() + " table metadata must be initializable");

        Set<String> columns = new LinkedHashSet<>();
        columns.add(info.getKeyColumn());
        info.getFieldList().forEach(field -> columns.add(field.getColumn()));

        for (String expectedColumn : expectedTimeColumns) {
            assertTrue(columns.contains(expectedColumn),
                entityClass.getSimpleName() + " must map to schema column `" + expectedColumn
                    + "`; resolved=" + columns);
        }
        assertFalse(columns.contains("create_time"),
            entityClass.getSimpleName() + " must not map to legacy column `create_time`; resolved=" + columns);
        assertFalse(columns.contains("update_time"),
            entityClass.getSimpleName() + " must not map to legacy column `update_time`; resolved=" + columns);
    }

    private static Stream<Arguments> entityTimeColumnCases() {
        return Stream.of(
            Arguments.of(Admin.class, Set.of("created_at", "updated_at")),
            Arguments.of(AdminLoginLog.class, Set.of("created_at")),
            Arguments.of(Blacklist.class, Set.of("created_at")),
            Arguments.of(Evaluation.class, Set.of("created_at")),
            Arguments.of(FlashSaleOrderExt.class, Set.of("created_at")),
            Arguments.of(FlashSaleSession.class, Set.of("created_at", "updated_at")),
            Arguments.of(OperationLog.class, Set.of("created_at")),
            Arguments.of(ProductFavorite.class, Set.of("created_at")),
            Arguments.of(ProductImage.class, Set.of("created_at")),
            Arguments.of(ProductStatistics.class, Set.of("created_at", "updated_at")),
            Arguments.of(QuickReply.class, Set.of("created_at", "updated_at")),
            Arguments.of(Report.class, Set.of("created_at")),
            Arguments.of(ShareItemImage.class, Set.of("created_at")),
            Arguments.of(UserFollow.class, Set.of("created_at"))
        );
    }
}

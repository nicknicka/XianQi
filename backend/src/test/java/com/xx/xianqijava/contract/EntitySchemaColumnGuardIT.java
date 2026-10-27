package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.metadata.TableFieldInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 全量「实体字段 ↔ schema 列」列映射契约守卫。
 *
 * <p>历史缺陷（issue #24 / #45 / #49）：Java 字段按驼峰转下划线推断出的列名，在
 * {@code sql/schema.sql} 里并不存在，只有对真实库执行查询时才报 {@code Unknown column}。
 * 这类漂移不在编译期暴露，且过去靠人工枚举清单（{@code UserColumnMappingTest} /
 * {@code NonBaseEntityTimeColumnMappingTest}）防御——新增实体不会自动进入清单，遗漏是默认结局。
 *
 * <p>本守卫改为自动契约：枚举 Spring/MyBatis-Plus 启动后注册的<b>全部</b>实体，读取
 * MyBatis-Plus <b>实际解析出的列映射</b>（而非对源码做正则），逐列断言其存在于
 * {@code sql/schema.sql} 对应表中。新增实体自动进入覆盖，无需登记。
 *
 * <p>只验证外部行为：实体字段最终解析成哪些列、这些列是否真实存在；不断言 SQL 文本、
 * 不测 Mapper 的字符串拼接。此守卫建立在真实运行时元数据上，因此既不会因
 * {@code @TableField} / {@code @TableId} 显式覆盖而误报，也不会漏掉它们。
 *
 * <p>不依赖真实数据库连接：MyBatis-Plus 元数据在应用上下文启动时注册，schema 侧只需读取
 * {@code sql/schema.sql} 这个结构真源本身。
 */
@SpringBootTest
class EntitySchemaColumnGuardIT {

    /** CREATE TABLE `name` ( ... ) ... 的列定义块。 */
    private static final Pattern CREATE_TABLE =
        Pattern.compile("CREATE TABLE `([^`]+)` \\((.*?)\\n\\) ENGINE", Pattern.DOTALL);

    /** 列定义行以 `column` TYPE 起头；排除表级约束（PRIMARY/UNIQUE/KEY/CONSTRAINT/FOREIGN）。 */
    private static final Pattern COLUMN_DEF = Pattern.compile("`([^`]+)`\\s+[A-Za-z]");

    private static final Pattern TABLE_CONSTRAINT =
        Pattern.compile("(?i)^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\\b.*");

    @Test
    void everyEntityColumnExistsInSchema() throws IOException {
        Map<String, Set<String>> schema = parseSchema();

        List<TableInfo> tableInfos = TableInfoHelper.getTableInfos();
        assertFalse(tableInfos.isEmpty(),
            "MyBatis-Plus 未注册任何实体的 TableInfo；守卫本身失去意义，需排查上下文启动。");

        List<String> failures = new ArrayList<>();
        for (TableInfo info : tableInfos) {
            String table = info.getTableName().replace("`", "");
            Set<String> schemaColumns = schema.get(table);
            if (schemaColumns == null) {
                failures.add(String.format("%s（实体 %s）：schema.sql 中不存在表 `%s`",
                    info.getTableName(), info.getEntityType().getSimpleName(), table));
                continue;
            }

            Map<String, String> resolved = resolvedColumns(info);
            for (Map.Entry<String, String> entry : resolved.entrySet()) {
                String column = entry.getValue();
                if (!schemaColumns.contains(column)) {
                    failures.add(String.format(
                        "实体 %s.%s 推断/映射出列 `%s`，但 schema.sql 的表 `%s` 中不存在该列",
                        info.getEntityType().getSimpleName(), entry.getKey(), column, table));
                }
            }
        }

        assertTrue(failures.isEmpty(),
            "实体↔schema 列映射守卫失败（" + failures.size() + " 处）：\n  - "
                + String.join("\n  - ", failures)
                + "\n请把实体映射对齐 sql/schema.sql，或修正 schema。");
    }

    /** 主键列 + 所有字段列，字段名 -> 列名（用于失败信息定位到字段）。 */
    private static Map<String, String> resolvedColumns(TableInfo info) {
        Map<String, String> resolved = new LinkedHashMap<>();
        if (info.getKeyProperty() != null && info.getKeyColumn() != null) {
            resolved.put(info.getKeyProperty(), info.getKeyColumn());
        }
        for (TableFieldInfo field : info.getFieldList()) {
            resolved.put(field.getProperty(), field.getColumn());
        }
        return resolved;
    }

    /** 解析 sql/schema.sql（结构真源），返回 表名 -> 列名集合。 */
    static Map<String, Set<String>> parseSchema() throws IOException {
        Path schemaPath = Path.of("..", "sql", "schema.sql").normalize();
        assertTrue(Files.exists(schemaPath), "schema.sql must be reachable from backend/: " + schemaPath);
        String sql = Files.readString(schemaPath);

        Map<String, Set<String>> tables = new LinkedHashMap<>();
        Matcher tableMatcher = CREATE_TABLE.matcher(sql);
        while (tableMatcher.find()) {
            Set<String> columns = new LinkedHashSet<>();
            for (String rawLine : tableMatcher.group(2).split("\n")) {
                String line = rawLine.trim();
                if (TABLE_CONSTRAINT.matcher(line).matches()) {
                    continue;
                }
                Matcher columnMatcher = COLUMN_DEF.matcher(line);
                while (columnMatcher.find()) {
                    columns.add(columnMatcher.group(1));
                }
            }
            tables.put(tableMatcher.group(1), columns);
        }
        assertFalse(tables.isEmpty(), "未从 sql/schema.sql 解析出任何表定义");
        return tables;
    }
}

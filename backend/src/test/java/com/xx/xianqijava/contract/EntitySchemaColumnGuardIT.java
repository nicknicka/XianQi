package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableFieldInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfo;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
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

    /** ALTER TABLE `name` ( ... ); —— schema 的第二个 pass（见 docs/adr/0004）。 */
    private static final Pattern ALTER_TABLE =
        Pattern.compile("ALTER TABLE `([^`]+)`(.*?);", Pattern.DOTALL);

    private static final Pattern ALTER_ADD_COLUMN =
        Pattern.compile("(?i)ADD\\s+(?:COLUMN\\s+)?`([^`]+)`");

    private static final Pattern ALTER_DROP_COLUMN =
        Pattern.compile("(?i)DROP\\s+(?:COLUMN\\s+)?`([^`]+)`");

    private static final Pattern ALTER_CHANGE_COLUMN =
        Pattern.compile("(?i)CHANGE\\s+(?:COLUMN\\s+)?`([^`]+)`\\s+`([^`]+)`");

    /** 扫描全部带 @TableName 的实体的基础包（不限于 entity 子包）。 */
    private static final String BASE_PACKAGE = "com.xx.xianqijava";

    @Test
    void everyEntityColumnExistsInSchema() throws IOException, ClassNotFoundException {
        Map<String, Set<String>> schema = parseSchema();

        // 不能只用 TableInfoHelper.getTableInfos()：它只包含带 Mapper 而被 MyBatis-Plus 注册的实体，
        // 没有 Mapper 的实体（例如 ConversationMember）不会出现，正是本 spec 要消灭的「默认漏检」。
        // 因此按 @TableName 注解做类路径扫描，枚举全部实体。
        List<Class<?>> entities = scanEntities();
        assertFalse(entities.isEmpty(),
            "未扫描到任何带 @TableName 的实体；守卫本身失去意义，需排查类路径。");
        // 类路径扫描必须至少覆盖 MyBatis-Plus 已注册（带 Mapper）的实体；若退化为只覆盖后者，
        // ConversationMember 这类无 Mapper 实体会再次漏检。
        int registered = TableInfoHelper.getTableInfos().size();
        assertTrue(entities.size() >= registered,
            "类路径扫描得到的实体数 " + entities.size() + " 少于 MyBatis-Plus 已注册实体数 "
                + registered + "；枚举逻辑可能退化。");

        MybatisConfiguration configuration = new MybatisConfiguration();
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(configuration, "");

        List<String> failures = new ArrayList<>();
        for (Class<?> entityClass : entities) {
            TableInfoHelper.initTableInfo(assistant, entityClass);
            TableInfo info = TableInfoHelper.getTableInfo(entityClass);
            if (info == null) {
                failures.add(String.format("实体 %s 无法解析 TableInfo", entityClass.getSimpleName()));
                continue;
            }
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

    /**
     * 守卫自测：枚举必须覆盖「没有 Mapper、因此不会被 MyBatis-Plus 自动注册」的实体。
     *
     * <p>{@code ConversationMember} 没有 Mapper，{@code TableInfoHelper.getTableInfos()} 看不到它。
     * 若守卫退回用 getTableInfos() 枚举，本测试会失败——避免再次出现「默认漏检」。
     */
    @Test
    void scanCoversEntitiesWithoutMapper() throws ClassNotFoundException {
        List<String> simpleNames = scanEntities().stream().map(Class::getSimpleName).toList();
        assertTrue(simpleNames.contains("ConversationMember"),
            "列映射守卫必须覆盖没有 Mapper 的 ConversationMember；实际扫描到 " + simpleNames.size() + " 个实体");
    }

    /**
     * 守卫自测：schema 的 ALTER pass 必须被解析，否则 {@code ALTER TABLE ... ADD COLUMN}
     * 会导致假阳性（把真实存在的列报成不存在）。用合成 schema 直接验证。
     */
    @Test
    void applyAlterTableTracksColumnLifecycle(@TempDir Path dir) throws IOException {
        Path schema = dir.resolve("schema.sql");
        Files.writeString(schema, """
            CREATE TABLE `t` (
              `id` BIGINT NOT NULL,
              `old_name` VARCHAR(10) NOT NULL,
              `dropped` TINYINT NOT NULL,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB;
            ALTER TABLE `t`
              ADD COLUMN `added` TINYINT NULL,
              CHANGE COLUMN `old_name` `renamed` VARCHAR(10) NOT NULL,
              DROP COLUMN `dropped`,
              MODIFY COLUMN `id` BIGINT NOT NULL,
              ADD CONSTRAINT `fk_t` FOREIGN KEY (`id`) REFERENCES `t` (`id`);
            """);

        Map<String, Set<String>> tables = parseSchemaFile(schema);
        Set<String> columns = tables.get("t");
        assertTrue(columns.contains("added"), "ADD COLUMN must register the column");
        assertTrue(columns.contains("renamed"), "CHANGE COLUMN must register the new name");
        assertFalse(columns.contains("old_name"), "CHANGE COLUMN must drop the old name");
        assertFalse(columns.contains("dropped"), "DROP COLUMN must remove the column");
        assertTrue(columns.contains("id"), "MODIFY COLUMN must keep the column");
    }

    /** 通过 @TableName 注解做类路径扫描，枚举全部实体（不只是被 Mapper 注册的那些）。 */
    private static List<Class<?>> scanEntities() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner =
            new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(TableName.class));
        List<Class<?>> entities = new ArrayList<>();
        for (BeanDefinition candidate : scanner.findCandidateComponents(BASE_PACKAGE)) {
            entities.add(Class.forName(candidate.getBeanClassName()));
        }
        entities.sort(Comparator.comparing(Class::getSimpleName));
        return entities;
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
        return parseSchemaFile(schemaPath);
    }

    /** 解析指定 schema 文件（结构真源），返回 表名 -> 列名集合。供守卫与自测共用。 */
    static Map<String, Set<String>> parseSchemaFile(Path schemaPath) throws IOException {
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
        applyAlterTable(sql, tables);
        return tables;
    }

    /**
     * 应用 ALTER TABLE，避免把 {@code ALTER TABLE ... ADD COLUMN} 当成「实体列不存在」的假象，
     * 也避免漏掉 ALTER 真正新增的列。schema 是 CREATE pass + ALTER pass（见 docs/adr/0004）。
     *
     * <p>只处理列操作：{@code ADD [COLUMN] x}、{@code DROP [COLUMN] x}、{@code CHANGE ... x y}。
     * {@code ADD CONSTRAINT/KEY/INDEX} 后面跟的不是反引号列名，因此不会命中；
     * {@code MODIFY COLUMN} 只是重定义既有列，列集合不变，故有意忽略。
     */
    private static void applyAlterTable(String sql, Map<String, Set<String>> tables) {
        Matcher alterMatcher = ALTER_TABLE.matcher(sql);
        while (alterMatcher.find()) {
            String table = alterMatcher.group(1);
            Set<String> columns = tables.get(table);
            if (columns == null) {
                continue;
            }
            for (String statement : alterMatcher.group(2).split(",")) {
                String text = statement.trim();
                Matcher change = ALTER_CHANGE_COLUMN.matcher(text);
                Matcher add = ALTER_ADD_COLUMN.matcher(text);
                Matcher drop = ALTER_DROP_COLUMN.matcher(text);
                if (change.find()) {
                    columns.remove(change.group(1));
                    columns.add(change.group(2));
                } else if (add.find()) {
                    columns.add(add.group(1));
                } else if (drop.find()) {
                    columns.remove(drop.group(1));
                }
            }
        }
    }
}

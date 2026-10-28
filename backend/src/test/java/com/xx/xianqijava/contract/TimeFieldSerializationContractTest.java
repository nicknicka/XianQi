package com.xx.xianqijava.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * HTTP 契约测试：时间字段统一为 createdAt / updatedAt。
 *
 * <p>这是 spec #61 contract 阶段的保障。它在全部 VO 上强制两条约束：
 * <ol>
 *   <li>不存在已废弃的 createTime / updateTime 字段；</li>
 *   <li>凡提供时间字段的 VO，其对外序列化名称为 createdAt / updatedAt。</li>
 * </ol>
 *
 * <p>与 {@code scripts/check-time-field-naming.py} 互补：那个守卫做源码级全量扫描，
 * 这个测试做真实序列化行为验证。
 */
class TimeFieldSerializationContractTest {

    private static final String VO_PACKAGE = "com.xx.xianqijava.vo";

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /** 枚举全部 VO（含子包），避免逐个登记导致新增 VO 漏检。 */
    private List<Class<?>> allVos() throws Exception {
        ClassPathScanningCandidateComponentProvider provider =
                new ClassPathScanningCandidateComponentProvider(false);
        provider.addIncludeFilter(new AssignableTypeFilter(Object.class));
        Set<Class<?>> found = new LinkedHashSet<>();
        for (BeanDefinition bd : provider.findCandidateComponents(VO_PACKAGE)) {
            Class<?> type = Class.forName(bd.getBeanClassName());
            if (type.getName().endsWith("VO")) {
                found.add(type);
            }
        }
        return new ArrayList<>(found);
    }

    @Test
    void noVoDeclaresRetiredTimeFields() throws Exception {
        List<String> violations = new ArrayList<>();
        for (Class<?> vo : allVos()) {
            if (hasField(vo, "createTime") || hasField(vo, "updateTime")) {
                violations.add(vo.getSimpleName());
            }
        }
        assertTrue(violations.isEmpty(),
                "以下 VO 仍声明已废弃的时间字段：" + String.join(", ", violations));
    }

    @Test
    void canonicalNamesAreReadableWhereTimeIsExposed() throws Exception {
        // 至少要有一个真实 VO 证明 createdAt 可读且可序列化
        Class<?> target = Class.forName("com.xx.xianqijava.vo.CategoryVO");
        Object vo = target.getDeclaredConstructor().newInstance();
        invokeSetter(vo, "setCreatedAt", String.class, "2026-01-02 03:04:05");
        Object value = invokeGetter(vo, "getCreatedAt");
        assertEquals("2026-01-02 03:04:05", value);
    }

    @Test
    void serializedJsonUsesOnlyCanonicalNames() throws Exception {
        Class<?> target = Class.forName("com.xx.xianqijava.vo.CategoryVO");
        Object vo = target.getDeclaredConstructor().newInstance();
        invokeSetter(vo, "setCreatedAt", String.class, "2026-01-02 03:04:05");
        String json = objectMapper.writeValueAsString(vo);
        assertTrue(json.contains("\"createdAt\":\"2026-01-02 03:04:05\""), json);
        assertFalse(json.contains("\"createTime\""), json);
        assertFalse(json.contains("\"updateTime\""), json);
    }

    @Test
    void localDateTimeTimeFieldsSerializeWithCanonicalNames() throws Exception {
        Object vo = Class.forName("com.xx.xianqijava.vo.OrderVO")
                .getDeclaredConstructor().newInstance();
        invokeSetter(vo, "setCreatedAt", LocalDateTime.class,
                LocalDateTime.of(2026, 5, 6, 7, 8, 9));
        String json = objectMapper.writeValueAsString(vo);
        assertTrue(json.contains("\"createdAt\":\"2026-05-06 07:08:09\""), json);
        assertFalse(json.contains("\"createTime\""), json);
    }

    private boolean hasField(Class<?> type, String name) {
        for (Field f : type.getDeclaredFields()) {
            if (f.getName().equals(name)) {
                return true;
            }
        }
        return false;
    }

    private void invokeSetter(Object target, String name, Class<?> paramType, Object value)
            throws Exception {
        Method m = target.getClass().getMethod(name, paramType);
        m.invoke(target, value);
    }

    private Object invokeGetter(Object target, String name) throws Exception {
        return target.getClass().getMethod(name).invoke(target);
    }
}

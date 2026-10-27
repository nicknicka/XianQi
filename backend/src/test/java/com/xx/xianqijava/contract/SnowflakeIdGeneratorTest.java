package com.xx.xianqijava.contract;

import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 雪花 ID 生成器验证测试（不依赖数据库，本地可跑）。
 * 
 * 验证：
 * 1. MyBatis-Plus 内置雪花 ID 生成器工作正常
 * 2. 生成的 ID 超过 JS 安全整数范围（2^53 - 1）
 * 3. 生成的 ID 为正数
 * 4. 批量生成的 ID 不重复（唯一性）
 * 5. ID 转字符串再转回 Long 不丢精度（往返验证）
 */
class SnowflakeIdGeneratorTest {

    @Test
    void snowflakeId_isPositive() {
        long id = IdWorker.getId();
        assertTrue(id > 0, "snowflake ID should be positive, got: " + id);
    }

    @Test
    void snowflakeId_exceedsJsSafeIntegerMax() {
        long id = IdWorker.getId();
        long jsSafeMax = (1L << 53) - 1; // 9007199254740991

        assertTrue(id > jsSafeMax,
            "Snowflake ID (" + id + ") should exceed JS Number.MAX_SAFE_INTEGER (" + jsSafeMax + "). " +
            "This proves why IDs must be serialized as strings over HTTP.");
    }

    @Test
    void snowflakeId_stringRoundTrip_noPrecisionLoss() {
        long original = IdWorker.getId();
        String asString = Long.toString(original);
        long parsedBack = Long.parseLong(asString);

        assertEquals(original, parsedBack,
            "ID should survive string round-trip without precision loss");
    }

    @Test
    void snowflakeId_batchGeneration_uniqueAndOrdered() {
        int count = 1000;
        long[] ids = new long[count];
        long prev = 0;

        for (int i = 0; i < count; i++) {
            ids[i] = IdWorker.getId();
            assertNotEquals(0, ids[i], "ID should not be 0");

            if (i > 0) {
                // 雪花 ID 应该是趋势递增的（同 worker 内严格递增）
                assertTrue(ids[i] > prev,
                    "ID should be monotonically increasing: " + ids[i] + " > " + prev);
            }
            prev = ids[i];
        }

        // 验证唯一性
        long distinctCount = java.util.Arrays.stream(ids).distinct().count();
        assertEquals(count, distinctCount,
            "All " + count + " generated IDs should be unique");
    }

    @Test
    void jsNumber_cannotPreciselyRepresentSnowflakeId() {
        long id = IdWorker.getId();
        String idStr = Long.toString(id);

        // 模拟 JS 的行为：Number 解析大整数会丢精度
        // 我们用 double 来模拟（JS Number 就是 IEEE 754 double）
        double asDouble = Double.parseDouble(idStr);
        long backFromDouble = (long) asDouble;

        // 证明 double 无法精确表示雪花 ID
        // （这就是为什么前端必须用 string，不能用 number）
        assertNotEquals(id, backFromDouble,
            "Snowflake ID (" + id + ") loses precision when cast through double (" +
            backFromDouble + "). This confirms string ID contract is necessary.");
    }
}

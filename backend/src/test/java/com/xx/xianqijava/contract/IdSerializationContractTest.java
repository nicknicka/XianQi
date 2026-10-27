package com.xx.xianqijava.contract;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xx.xianqijava.entity.Category;
import com.xx.xianqijava.entity.Product;
import com.xx.xianqijava.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * HTTP 契约测试：验证业务主键 ID 在 JSON 序列化时为字符串类型。
 * 
 * 这是 ID 对外契约的核心保障：Java 内部用 Long（雪花 ID），
 * 但通过 HTTP 传输时必须是字符串，避免前端 JS Number 精度丢失。
 */
class IdSerializationContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void userId_serializesAsStringInJson() throws JsonProcessingException {
        User user = new User();
        // 使用典型的雪花 ID（2^53 以上，JS Number 无法精确表示）
        long snowflakeId = 288626339412582000L;
        user.setUserId(snowflakeId);

        String json = objectMapper.writeValueAsString(user);

        // userId 字段应该是字符串（带引号），不是数字
        assertTrue(json.contains("\"userId\":\"" + snowflakeId + "\""),
            "userId should be serialized as string in JSON, got: " + json);
    }

    @Test
    void productId_and_sellerId_and_categoryId_serializeAsString() throws JsonProcessingException {
        Product product = new Product();
        long productId = 288626339412582001L;
        long sellerId = 288626339412582002L;
        long categoryId = 288626339412582003L;

        product.setProductId(productId);
        product.setSellerId(sellerId);
        product.setCategoryId(categoryId);

        String json = objectMapper.writeValueAsString(product);

        assertTrue(json.contains("\"productId\":\"" + productId + "\""),
            "productId should be string");
        assertTrue(json.contains("\"sellerId\":\"" + sellerId + "\""),
            "sellerId should be string");
        assertTrue(json.contains("\"categoryId\":\"" + categoryId + "\""),
            "categoryId should be string");
    }

    @Test
    void categoryId_serializesAsString() throws JsonProcessingException {
        Category category = new Category();
        long categoryId = 288626339412582010L;
        category.setCategoryId(categoryId);

        String json = objectMapper.writeValueAsString(category);

        assertTrue(json.contains("\"categoryId\":\"" + categoryId + "\""),
            "categoryId should be string in JSON, got: " + json);
    }

    @Test
    void snowflakeId_exceedsJsSafeInteger() {
        // 雪花 ID 典型值（18 位十进制）
        long snowflakeId = 288626339412582000L;
        // JS Number 的安全整数上限：2^53 - 1
        long jsSafeMax = (1L << 53) - 1;

        // 验证雪花 ID 确实超过 JS 安全整数范围（证明字符串序列化的必要性）
        assertTrue(snowflakeId > jsSafeMax,
            "Snowflake ID (" + snowflakeId + ") should exceed JS safe integer max (" + jsSafeMax + ")");
    }
}

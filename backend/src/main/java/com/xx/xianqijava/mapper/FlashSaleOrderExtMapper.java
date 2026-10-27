package com.xx.xianqijava.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xx.xianqijava.entity.FlashSaleOrderExt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 秒杀订单扩展 Mapper
 */
@Mapper
public interface FlashSaleOrderExtMapper extends BaseMapper<FlashSaleOrderExt> {


    /**
     * 查询用户在某商品的秒杀订单
     */
    @Select("SELECT * FROM flash_sale_order_ext " +
            "WHERE user_id = #{userId} " +
            "AND product_id = #{productId} " +
            "ORDER BY created_at DESC")
    List<FlashSaleOrderExt> selectByUserAndProduct(@Param("userId") Long userId,
                                                 @Param("productId") Long productId);
}

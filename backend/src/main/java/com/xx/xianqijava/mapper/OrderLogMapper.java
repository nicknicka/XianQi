package com.xx.xianqijava.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xx.xianqijava.entity.OrderLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单操作日志Mapper接口
 */
@Mapper
public interface OrderLogMapper extends BaseMapper<OrderLog> {
}

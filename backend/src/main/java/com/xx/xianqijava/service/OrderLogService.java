package com.xx.xianqijava.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.xx.xianqijava.entity.OrderLog;
import com.xx.xianqijava.vo.OrderLogVO;

import java.util.List;

/**
 * 订单操作日志服务接口
 */
public interface OrderLogService extends IService<OrderLog> {

    /**
     * 记录一次订单操作日志。
     *
     * @param orderId      订单ID
     * @param operatorId   操作人用户ID，可空
     * @param operatorName 操作人昵称，可空
     * @param action       操作类型（英文 code，如 create/confirm）
     * @param detail       操作描述，可空
     */
    void record(Long orderId, Long operatorId, String operatorName, String action, String detail);

    /**
     * 查询某订单的操作日志，按时间升序。
     *
     * @param orderId 订单ID
     * @return 订单日志列表
     */
    List<OrderLogVO> getOrderLogs(Long orderId);
}

package com.xx.xianqijava.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xx.xianqijava.entity.OrderLog;
import com.xx.xianqijava.mapper.OrderLogMapper;
import com.xx.xianqijava.service.OrderLogService;
import com.xx.xianqijava.vo.OrderLogVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 订单操作日志服务实现类
 */
@Slf4j
@Service
public class OrderLogServiceImpl extends ServiceImpl<OrderLogMapper, OrderLog>
        implements OrderLogService {

    @Override
    public void record(Long orderId, Long operatorId, String operatorName,
                       String action, String detail) {
        try {
            OrderLog orderLog = new OrderLog();
            orderLog.setOrderId(orderId);
            orderLog.setOperatorId(operatorId);
            orderLog.setOperatorName(operatorName);
            orderLog.setAction(action);
            orderLog.setDetail(detail);
            save(orderLog);
        } catch (Exception e) {
            // 订单日志失败不应影响主业务
            log.error("保存订单操作日志失败, orderId={}, action={}", orderId, action, e);
        }
    }

    @Override
    public List<OrderLogVO> getOrderLogs(Long orderId) {
        LambdaQueryWrapper<OrderLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderLog::getOrderId, orderId)
                .orderByAsc(OrderLog::getCreatedAt)
                .orderByAsc(OrderLog::getOrderLogId);

        return list(wrapper).stream().map(this::convertToVO).toList();
    }

    private OrderLogVO convertToVO(OrderLog orderLog) {
        OrderLogVO vo = new OrderLogVO();
        String logId = String.valueOf(orderLog.getOrderLogId());
        vo.setLogId(logId);
        vo.setId(logId);
        vo.setOrderId(String.valueOf(orderLog.getOrderId()));
        vo.setUserId(orderLog.getOperatorId() == null ? null : String.valueOf(orderLog.getOperatorId()));
        vo.setUsername(orderLog.getOperatorName());
        vo.setAction(orderLog.getAction());
        vo.setActionText(getActionText(orderLog.getAction()));
        vo.setDescription(orderLog.getDetail());
        vo.setCreatedAt(orderLog.getCreatedAt() == null ? null : orderLog.getCreatedAt().toString());
        return vo;
    }

    /**
     * 操作类型 code -> 中文展示文案。
     */
    private String getActionText(String action) {
        if (action == null) {
            return "未知操作";
        }
        return switch (action) {
            case "create" -> "创建订单";
            case "confirm" -> "确认订单";
            case "cancel" -> "取消订单";
            case "complete" -> "完成订单";
            case "refund_request" -> "申请退款";
            case "refund_approve" -> "同意退款";
            case "refund_reject" -> "拒绝退款";
            default -> action;
        };
    }
}

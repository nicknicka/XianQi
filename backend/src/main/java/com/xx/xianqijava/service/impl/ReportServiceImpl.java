package com.xx.xianqijava.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xx.xianqijava.common.ErrorCode;
import com.xx.xianqijava.dto.ReportCreateDTO;
import com.xx.xianqijava.entity.Report;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.mapper.ReportMapper;
import com.xx.xianqijava.mapper.UserMapper;
import com.xx.xianqijava.service.ReportService;
import com.xx.xianqijava.util.IdConverter;
import com.xx.xianqijava.vo.ReportVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 举报服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl extends ServiceImpl<ReportMapper, Report> implements ReportService {

    /** 举报对象为用户时，被举报人信息由 targetId 派生。 */
    private static final String TARGET_TYPE_USER = "user";

    private final UserMapper userMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportVO createReport(ReportCreateDTO createDTO, Long reporterId) {
        log.info("创建举报, reporterId={}, targetType={}, targetId={}",
                reporterId, createDTO.getTargetType(), createDTO.getTargetId());

        Long targetId = IdConverter.toLong(createDTO.getTargetId());

        // 举报对象为用户时，做归属与存在性校验
        if (TARGET_TYPE_USER.equals(createDTO.getTargetType())) {
            if (reporterId.equals(targetId)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "不能举报自己");
            }
            User reportedUser = userMapper.selectById(targetId);
            if (reportedUser == null) {
                throw new BusinessException(ErrorCode.USER_NOT_FOUND, "被举报的用户不存在");
            }
        }

        // 创建举报记录
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setTargetType(createDTO.getTargetType());
        report.setTargetId(targetId);
        report.setReason(createDTO.getReason());
        report.setDescription(createDTO.getDescription());
        report.setEvidenceImages(createDTO.getEvidenceImages());
        report.setType(createDTO.getType() == null ? 0 : createDTO.getType());
        report.setStatus(0); // 待处理

        save(report);
        log.info("举报创建成功, reportId={}", report.getReportId());

        return convertToVO(report);
    }

    @Override
    public IPage<ReportVO> getMyReports(Long reporterId, Page<Report> page) {
        log.info("查询我的举报列表, reporterId={}", reporterId);

        LambdaQueryWrapper<Report> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Report::getReporterId, reporterId)
                .orderByDesc(Report::getCreatedAt);

        IPage<Report> reportPage = page(page, queryWrapper);
        return reportPage.convert(this::convertToVO);
    }

    @Override
    public IPage<ReportVO> getReportListForAdmin(Page<Report> page, Integer status, String reason) {
        LambdaQueryWrapper<Report> queryWrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            queryWrapper.eq(Report::getStatus, status);
        }
        if (reason != null && !reason.trim().isEmpty()) {
            queryWrapper.like(Report::getReason, reason);
        }
        queryWrapper.orderByDesc(Report::getCreatedAt);

        IPage<Report> reportPage = page(page, queryWrapper);
        return reportPage.convert(this::convertToVO);
    }

    @Override
    public ReportVO getReportDetail(Long reportId) {
        Report report = getById(reportId);
        return report == null ? null : convertToVO(report);
    }

    @Override
    public boolean handleReport(Long reportId, Integer status, String handleNote, Long handlerId) {
        Report report = getById(reportId);
        if (report == null || report.getStatus() != 0) {
            return false;
        }
        report.setStatus(status);
        report.setHandleNote(handleNote);
        report.setHandlerId(handlerId);
        report.setHandleTime(java.time.LocalDateTime.now());
        return updateById(report);
    }

    @Override
    public int batchHandleReports(List<Long> reportIds, String handleNote, Long handlerId) {
        int count = 0;
        for (Long reportId : reportIds) {
            if (handleReport(reportId, 1, handleNote, handlerId)) {
                count++;
            }
        }
        return count;
    }

    @Override
    public boolean deleteReport(Long reportId) {
        return removeById(reportId);
    }

    @Override
    public int batchDeleteReports(List<Long> reportIds) {
        if (reportIds == null || reportIds.isEmpty()) {
            return 0;
        }
        removeByIds(reportIds);
        return reportIds.size();
    }

    /**
     * 转换为VO
     */
    private ReportVO convertToVO(Report report) {
        ReportVO vo = new ReportVO();
        vo.setReportId(String.valueOf(report.getReportId()));
        vo.setReporterId(String.valueOf(report.getReporterId()));
        vo.setTargetType(report.getTargetType());
        vo.setTargetId(String.valueOf(report.getTargetId()));
        vo.setReason(report.getReason());
        vo.setDescription(report.getDescription());
        vo.setEvidenceImages(report.getEvidenceImages());
        vo.setType(report.getType());
        vo.setStatus(report.getStatus());
        vo.setStatusDesc(getStatusDesc(report.getStatus()));
        vo.setHandlerId(report.getHandlerId() == null ? null : String.valueOf(report.getHandlerId()));
        vo.setHandleNote(report.getHandleNote());
        vo.setAdminNote(report.getHandleNote());
        vo.setHandleTime(report.getHandleTime());
        vo.setCreatedAt(report.getCreatedAt());
        vo.setUpdatedAt(report.getUpdatedAt());

        // 获取举报人信息
        User reporter = userMapper.selectById(report.getReporterId());
        if (reporter != null) {
            vo.setReporterNickname(reporter.getNickname());
            vo.setReporterAvatar(reporter.getAvatar());
        }

        // 举报对象为用户时，补充被举报人信息
        if (TARGET_TYPE_USER.equals(report.getTargetType())) {
            vo.setReportedUserId(String.valueOf(report.getTargetId()));
            User reportedUser = userMapper.selectById(report.getTargetId());
            if (reportedUser != null) {
                vo.setReportedUserNickname(reportedUser.getNickname());
                vo.setReportedUserAvatar(reportedUser.getAvatar());
            }
        }

        return vo;
    }

    /**
     * 获取举报状态描述
     */
    private String getStatusDesc(Integer status) {
        switch (status) {
            case 0:
                return "待处理";
            case 1:
                return "已处理";
            case 2:
                return "已驳回";
            default:
                return "未知状态";
        }
    }
}

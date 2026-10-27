package com.xx.xianqijava.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.xx.xianqijava.dto.ReportCreateDTO;
import com.xx.xianqijava.entity.Report;
import com.xx.xianqijava.vo.ReportVO;

import java.util.List;

/**
 * 举报服务接口
 */
public interface ReportService extends IService<Report> {

    /**
     * 创建举报
     *
     * @param createDTO 举报信息
     * @param reporterId 举报人ID
     * @return 举报VO
     */
    ReportVO createReport(ReportCreateDTO createDTO, Long reporterId);

    /**
     * 获取我的举报列表
     *
     * @param reporterId 举报人ID
     * @param page       分页参数
     * @return 举报列表
     */
    IPage<ReportVO> getMyReports(Long reporterId, Page<Report> page);

    /**
     * 管理端分页查询举报列表
     *
     * @param page   分页参数
     * @param status 处理状态，可空
     * @param reason 举报原因，可空（模糊匹配）
     * @return 举报列表
     */
    IPage<ReportVO> getReportListForAdmin(Page<Report> page, Integer status, String reason);

    /**
     * 获取举报详情
     *
     * @param reportId 举报ID
     * @return 举报VO，不存在时返回 null
     */
    ReportVO getReportDetail(Long reportId);

    /**
     * 处理举报
     *
     * @param reportId  举报ID
     * @param status    目标状态（1-已处理 2-已驳回）
     * @param handleNote 处理备注
     * @param handlerId 处理管理员ID
     * @return 是否成功
     */
    boolean handleReport(Long reportId, Integer status, String handleNote, Long handlerId);

    /**
     * 批量处理举报
     *
     * @param reportIds  举报ID列表
     * @param handleNote 处理备注
     * @param handlerId  处理管理员ID
     * @return 成功处理的条数
     */
    int batchHandleReports(List<Long> reportIds, String handleNote, Long handlerId);

    /**
     * 删除举报记录
     *
     * @param reportId 举报ID
     * @return 是否成功
     */
    boolean deleteReport(Long reportId);

    /**
     * 批量删除举报记录
     *
     * @param reportIds 举报ID列表
     * @return 成功删除的条数
     */
    int batchDeleteReports(List<Long> reportIds);
}

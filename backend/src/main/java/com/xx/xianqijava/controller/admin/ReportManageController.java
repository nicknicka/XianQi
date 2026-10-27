package com.xx.xianqijava.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xx.xianqijava.annotation.OperationLog;
import com.xx.xianqijava.common.Result;
import com.xx.xianqijava.entity.Report;
import com.xx.xianqijava.mapper.ReportMapper;
import com.xx.xianqijava.security.SecurityContextHolder;
import com.xx.xianqijava.service.ReportService;
import com.xx.xianqijava.vo.ReportVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 举报管理后台接口
 */
@Slf4j
@Tag(name = "举报管理后台")
@RestController
@RequestMapping("/admin/report")
@RequiredArgsConstructor
public class ReportManageController {

    private final ReportService reportService;
    private final ReportMapper reportMapper;

    // ========== 查询接口 ==========

    /**
     * 获取举报列表（分页）
     */
    @GetMapping("/list")
    @Operation(summary = "获取举报列表")
    public Result<IPage<ReportVO>> getReportList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "页大小") @RequestParam(defaultValue = "20") Integer size,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "举报原因") @RequestParam(required = false) String reason) {
        log.info("查询举报列表, page={}, size={}, status={}, reason={}", page, size, status, reason);

        Page<Report> pageParam = new Page<>(page, size);
        IPage<ReportVO> resultPage = reportService.getReportListForAdmin(pageParam, status, reason);

        return Result.success(resultPage);
    }

    /**
     * 获取举报详情
     */
    @GetMapping("/{reportId}")
    @Operation(summary = "获取举报详情")
    public Result<ReportVO> getReportDetail(
            @Parameter(description = "举报ID") @PathVariable Long reportId) {
        log.info("获取举报详情, reportId={}", reportId);

        ReportVO report = reportService.getReportDetail(reportId);
        if (report == null) {
            return Result.error("举报记录不存在");
        }

        return Result.success(report);
    }

    /**
     * 获取举报统计
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取举报统计")
    public Result<Map<String, Object>> getStatistics() {
        log.info("获取举报统计");

        Map<String, Object> stats = new HashMap<>();

        // 总数
        Long total = reportMapper.selectCount(new LambdaQueryWrapper<>());
        stats.put("total", total);

        // 按状态统计
        Map<String, Long> statusStats = new HashMap<>();
        statusStats.put("pending", reportMapper.selectCount(
            new LambdaQueryWrapper<Report>().eq(Report::getStatus, 0)
        ));
        statusStats.put("processed", reportMapper.selectCount(
            new LambdaQueryWrapper<Report>().eq(Report::getStatus, 1)
        ));
        statusStats.put("rejected", reportMapper.selectCount(
            new LambdaQueryWrapper<Report>().eq(Report::getStatus, 2)
        ));
        stats.put("statusStats", statusStats);

        // 今日举报数
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        Long todayCount = reportMapper.selectCount(
            new LambdaQueryWrapper<Report>().ge(Report::getCreatedAt, todayStart)
        );
        stats.put("todayCount", todayCount);

        // 按原因统计
        List<Map<String, Object>> reasonStats = reportMapper.selectMaps(
            new LambdaQueryWrapper<Report>()
                .select(Report::getReason)
                .groupBy(Report::getReason)
        );
        stats.put("reasonStats", reasonStats);

        return Result.success(stats);
    }

    // ========== 处理接口 ==========

    /**
     * 处理举报
     */
    @PutMapping("/{reportId}/handle")
    @Operation(summary = "处理举报")
    @OperationLog(
            module = "report",
            action = "handle",
            description = "处理举报"
    )
    public Result<Boolean> handleReport(
            @Parameter(description = "举报ID") @PathVariable Long reportId,
            @Parameter(description = "处理备注") @RequestParam(required = false) String handleNote) {
        log.info("处理举报, reportId={}, handleNote={}", reportId, handleNote);

        if (!reportService.handleReport(reportId, 1, handleNote, SecurityContextHolder.getAdminId())) {
            return Result.error("举报记录不存在或已被处理");
        }

        log.info("处理举报成功, reportId={}", reportId);
        return Result.success(true);
    }

    /**
     * 驳回举报
     */
    @PutMapping("/{reportId}/reject")
    @Operation(summary = "驳回举报")
    @OperationLog(
            module = "report",
            action = "reject",
            description = "驳回举报"
    )
    public Result<Boolean> rejectReport(
            @Parameter(description = "举报ID") @PathVariable Long reportId,
            @Parameter(description = "驳回原因") @RequestParam(required = false) String handleNote) {
        log.info("驳回举报, reportId={}, handleNote={}", reportId, handleNote);

        if (!reportService.handleReport(reportId, 2, handleNote, SecurityContextHolder.getAdminId())) {
            return Result.error("举报记录不存在或已被处理");
        }

        log.info("驳回举报成功, reportId={}", reportId);
        return Result.success(true);
    }

    /**
     * 批量处理举报
     */
    @PutMapping("/batch/handle")
    @Operation(summary = "批量处理举报")
    @OperationLog(
            module = "report",
            action = "batch_handle",
            description = "批量处理举报"
    )
    public Result<Boolean> batchHandleReport(
            @RequestBody List<Long> reportIds,
            @Parameter(description = "处理备注") @RequestParam(required = false) String handleNote) {
        if (reportIds == null || reportIds.isEmpty()) {
            return Result.error("请选择要处理的举报");
        }
        log.info("批量处理举报, 数量={}, handleNote={}", reportIds.size(), handleNote);

        reportService.batchHandleReports(reportIds, handleNote, SecurityContextHolder.getAdminId());

        log.info("批量处理举报成功, 数量={}", reportIds.size());
        return Result.success(true);
    }

    /**
     * 删除举报记录
     */
    @DeleteMapping("/{reportId}")
    @Operation(summary = "删除举报记录")
    @OperationLog(
            module = "report",
            action = "delete",
            description = "删除举报记录"
    )
    public Result<Boolean> deleteReport(
            @Parameter(description = "举报ID") @PathVariable Long reportId) {
        log.info("删除举报记录, reportId={}", reportId);

        reportService.deleteReport(reportId);

        log.info("删除举报记录成功, reportId={}", reportId);
        return Result.success(true);
    }

    /**
     * 批量删除举报记录
     */
    @DeleteMapping("/batch")
    @Operation(summary = "批量删除举报记录")
    @OperationLog(
            module = "report",
            action = "batch_delete",
            description = "批量删除举报记录"
    )
    public Result<Boolean> batchDeleteReport(@RequestBody List<Long> reportIds) {
        if (reportIds == null || reportIds.isEmpty()) {
            return Result.error("请选择要删除的举报记录");
        }
        log.info("批量删除举报记录, 数量={}", reportIds.size());

        reportService.batchDeleteReports(reportIds);

        log.info("批量删除举报记录成功, 数量={}", reportIds.size());
        return Result.success(true);
    }
}

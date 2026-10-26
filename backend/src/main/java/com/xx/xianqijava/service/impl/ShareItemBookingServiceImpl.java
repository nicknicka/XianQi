package com.xx.xianqijava.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xx.xianqijava.common.ErrorCode;
import com.xx.xianqijava.dto.BookingApproveDTO;
import com.xx.xianqijava.dto.BookingReturnDTO;
import com.xx.xianqijava.dto.ShareItemBookingCreateDTO;
import com.xx.xianqijava.entity.ShareItem;
import com.xx.xianqijava.entity.ShareItemBooking;
import com.xx.xianqijava.entity.ShareItemImage;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.mapper.ShareItemBookingMapper;
import com.xx.xianqijava.mapper.ShareItemImageMapper;
import com.xx.xianqijava.mapper.ShareItemMapper;
import com.xx.xianqijava.mapper.UserMapper;
import com.xx.xianqijava.service.BusinessNotificationService;
import com.xx.xianqijava.service.ShareItemBookingService;
import com.xx.xianqijava.util.IdConverter;
import com.xx.xianqijava.vo.ShareItemBookingVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * 共享物品预约借用服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShareItemBookingServiceImpl extends ServiceImpl<ShareItemBookingMapper, ShareItemBooking>
        implements ShareItemBookingService {

    private final ShareItemMapper shareItemMapper;
    private final ShareItemImageMapper shareItemImageMapper;
    private final UserMapper userMapper;
    private final BusinessNotificationService businessNotificationService;
    private final com.xx.xianqijava.service.PaymentService paymentService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShareItemBookingVO createBooking(ShareItemBookingCreateDTO createDTO, Long borrowerId) {
        log.info("创建预约借用, borrowerId={}, shareId={}", borrowerId, createDTO.getShareId());

        // 1. 查询共享物品
        ShareItem shareItem = shareItemMapper.selectById(createDTO.getShareId());
        if (shareItem == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "共享物品不存在");
        }

        // 2. 检查物品状态
        if (shareItem.getStatus() != 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "物品当前不可借用");
        }

        // 3. 不能借用自己的物品
        if (shareItem.getOwnerId().equals(borrowerId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不能借用自己发布的物品");
        }

        // 4. 验证借用日期
        LocalDate startDate = createDTO.getStartDate();
        LocalDate endDate = createDTO.getEndDate();

        if (startDate.isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "借用开始日期不能早于今天");
        }

        if (endDate.isBefore(startDate)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "借用结束日期不能早于开始日期");
        }

        // 5. 检查日期范围是否已有预约
        LambdaQueryWrapper<ShareItemBooking> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(ShareItemBooking::getShareId, createDTO.getShareId())
                .in(ShareItemBooking::getStatus, 0, 1, 4) // 待审批、已批准、借用中
                .and(wrapper -> wrapper
                        .ge(ShareItemBooking::getEndDate, startDate)
                        .le(ShareItemBooking::getStartDate, endDate));

        long conflictCount = count(checkWrapper);
        if (conflictCount > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该时间段已被预约，请选择其他时间");
        }

        // 6. 计算借用天数和费用
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        BigDecimal dailyRent = shareItem.getDailyRent();
        BigDecimal deposit = shareItem.getDeposit();
        BigDecimal totalRent = dailyRent.multiply(BigDecimal.valueOf(days));
        BigDecimal totalAmount = totalRent.add(deposit);

        // 7. 创建预约记录
        ShareItemBooking booking = new ShareItemBooking();
        booking.setShareId(IdConverter.toLong(createDTO.getShareId()));
        booking.setOwnerId(shareItem.getOwnerId());
        booking.setBorrowerId(borrowerId);
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setDays((int) days);
        booking.setTotalRent(totalRent);
        booking.setDeposit(deposit);
        booking.setTotalAmount(totalAmount);
        booking.setRemark(createDTO.getRemark());
        booking.setStatus(0); // 待审批
        booking.setPaymentStatus(0);
        booking.setDepositReturned(0);

        boolean saved = save(booking);
        if (!saved) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "预约失败");
        }

        User borrower = userMapper.selectById(borrowerId);
        String borrowerName = borrower != null && StrUtil.isNotBlank(borrower.getNickname())
                ? borrower.getNickname()
                : "有用户";
        String notificationTitle = "新的共享借用申请";
        String notificationContent = String.format("%s 申请借用「%s」(%s 至 %s)，请及时处理。",
                borrowerName, shareItem.getTitle(), startDate, endDate);
        businessNotificationService.sendShareBookingReminder(
                shareItem.getOwnerId(), notificationTitle, notificationContent, booking.getBookingId());

        log.info("预约借用创建成功, bookingId={}", booking.getBookingId());
        return convertToVO(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShareItemBookingVO approveBooking(BookingApproveDTO approveDTO, Long ownerId) {
        log.info("审批预约, bookingId={}, status={}, ownerId={}",
                approveDTO.getBookingId(), approveDTO.getStatus(), ownerId);

        ShareItemBooking booking = getById(approveDTO.getBookingId());
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }

        // 验证权限
        if (!booking.getOwnerId().equals(ownerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限审批此预约");
        }

        // 验证状态
        if (booking.getStatus() != 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该预约已被处理");
        }

        int status = approveDTO.getStatus();
        if (status != 1 && status != 2) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "无效的审批状态");
        }

        // 更新预约状态
        booking.setStatus(status);
        booking.setApproveRemark(approveDTO.getApproveRemark());
        booking.setApproveTime(java.time.LocalDateTime.now());

        boolean updated = updateById(booking);
        if (!updated) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "审批失败");
        }

        // 注意：审批通过时不改变共享物品状态
        // 物品状态只有在借用者完成共享支付后才变为"借用中"
        // 这样可以防止审批后借用者未支付导致物品被锁定
        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        String shareTitle = shareItem != null ? shareItem.getTitle() : "共享物品";
        if (status == 1) {
            businessNotificationService.sendShareBookingReminder(
                    booking.getBorrowerId(),
                    "共享申请已通过",
                    String.format("您申请的「%s」已通过，请尽快支付租金和押金。", shareTitle),
                    booking.getBookingId());
        } else {
            businessNotificationService.sendShareBookingReminder(
                    booking.getBorrowerId(),
                    "共享申请已拒绝",
                    String.format("您申请的「%s」已被拒绝。", shareTitle),
                    booking.getBookingId());
        }

        log.info("预约审批成功, bookingId={}, status={}", booking.getBookingId(), status);
        return convertToVO(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelBooking(Long bookingId, Long borrowerId) {
        log.info("取消预约, bookingId={}, borrowerId={}", bookingId, borrowerId);

        ShareItemBooking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }

        // 验证权限
        if (!booking.getBorrowerId().equals(borrowerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限取消此预约");
        }

        // 只有待审批和已批准的预约可以取消
        if (booking.getStatus() != 0 && booking.getStatus() != 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该预约当前状态不允许取消");
        }

        // 保存原始状态用于判断是否需要恢复物品
        Integer originalStatus = booking.getStatus();

        // 更新预约状态为已取消
        booking.setStatus(3); // 已取消
        boolean updated = updateById(booking);
        if (!updated) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "取消预约失败");
        }

        // 如果取消的是借用中(status=4)的预约，需要恢复物品状态
        // 注意：审批通过(status=1)后物品状态仍为"可借用"，所以不需要恢复
        // 只有完成共享支付后(status=4)物品才变为"借用中"，取消时需要恢复
        if (originalStatus == 4) {
            ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
            if (shareItem != null && shareItem.getStatus() == 2) {
                shareItem.setStatus(1); // 恢复为可借用
                shareItemMapper.updateById(shareItem);
                log.info("恢复物品状态为可借用, shareId={}", shareItem.getShareId());
            }
        }

        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        String shareTitle = shareItem != null ? shareItem.getTitle() : "共享物品";
        businessNotificationService.sendShareBookingReminder(
                booking.getOwnerId(),
                "共享申请已取消",
                String.format("借用人已取消「%s」的借用申请。", shareTitle),
                booking.getBookingId());

        log.info("预约取消成功, bookingId={}", bookingId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShareItemBookingVO confirmReturn(BookingReturnDTO returnDTO, Long ownerId) {
        log.info("确认归还, bookingId={}, ownerId={}", returnDTO.getBookingId(), ownerId);

        ShareItemBooking booking = getById(returnDTO.getBookingId());
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }

        // 验证权限
        if (!booking.getOwnerId().equals(ownerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限确认归还");
        }

        // 验证状态
        if (booking.getStatus() != 4) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该预约状态不是借用中");
        }

        // 更新预约状态
        booking.setStatus(5); // 已完成
        booking.setReturnTime(java.time.LocalDateTime.now());
        booking.setReturnRemark(returnDTO.getReturnRemark());

        boolean updated = updateById(booking);
        if (!updated) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "确认归还失败");
        }

        // 恢复共享物品状态为可借用
        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        if (shareItem != null) {
            shareItem.setStatus(1); // 可借用
            shareItemMapper.updateById(shareItem);
            businessNotificationService.sendShareBookingReminder(
                    booking.getBorrowerId(),
                    "共享物品已确认归还",
                    String.format("所有者已确认「%s」归还成功。", shareItem.getTitle()),
                    booking.getBookingId());
        } else {
            businessNotificationService.sendShareBookingReminder(
                    booking.getBorrowerId(),
                    "共享物品已确认归还",
                    "所有者已确认共享物品归还成功。",
                    booking.getBookingId());
        }

        log.info("确认归还成功, bookingId={}", booking.getBookingId());
        return convertToVO(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShareItemBookingVO payBooking(Long bookingId, Long borrowerId) {
        log.info("支付共享预约总金额, bookingId={}, borrowerId={}", bookingId, borrowerId);

        ShareItemBooking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }

        // 验证权限
        if (!booking.getBorrowerId().equals(borrowerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限支付该预约");
        }

        // 验证状态 - 只有已批准(1)的预约才能支付
        if (booking.getStatus() != 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该预约状态不允许支付");
        }

        if (booking.getPaymentStatus() != null && booking.getPaymentStatus() == 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该预约已完成支付");
        }

        Map<String, Object> paymentResult = paymentService.createShareBookingPayment(
                booking.getBookingId(),
                booking.getTotalAmount(),
                booking.getShareId()
        );
        if (!(Boolean) paymentResult.getOrDefault("success", false)) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "创建支付订单失败：" + paymentResult.getOrDefault("message", "未知错误")
            );
        }

        String outTradeNo = (String) paymentResult.get("outTradeNo");

        // mock 支付场景下，查询成功后直接推进状态；真实环境应由支付回调驱动
        String paymentStatus = paymentService.queryPaymentStatus(outTradeNo);
        if (!"SUCCESS".equals(paymentStatus)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "支付尚未完成，请稍后重试");
        }

        // 更新预约状态为借用中
        booking.setStatus(4); // 借用中
        booking.setPaymentStatus(1);
        booking.setPaymentAmount(booking.getTotalAmount());
        booking.setPaymentOrderNo(outTradeNo);
        booking.setPayTime(java.time.LocalDateTime.now());
        booking.setDepositPaidTime(java.time.LocalDateTime.now());

        boolean updated = updateById(booking);
        if (!updated) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "支付失败");
        }

        // 更新共享物品状态为借用中
        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        if (shareItem != null) {
            shareItem.setStatus(2); // 借用中
            shareItemMapper.updateById(shareItem);
            businessNotificationService.sendShareBookingReminder(
                    booking.getOwnerId(),
                    "共享预约已支付",
                    String.format("借用人已完成「%s」的租金和押金支付，当前物品进入借用中。", shareItem.getTitle()),
                    booking.getBookingId());
        } else {
            businessNotificationService.sendShareBookingReminder(
                    booking.getOwnerId(),
                    "共享预约已支付",
                    "借用人已完成租金和押金支付，当前物品进入借用中。",
                    booking.getBookingId());
        }

        log.info("共享预约支付成功, bookingId={}, totalAmount={}", bookingId, booking.getTotalAmount());
        return convertToVO(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void returnDeposit(Long bookingId, Long ownerId) {
        log.info("退还押金, bookingId={}, ownerId={}", bookingId, ownerId);

        ShareItemBooking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }

        // 验证权限
        if (!booking.getOwnerId().equals(ownerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限退还押金");
        }

        // 验证状态
        if (booking.getStatus() != 5) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "只能退还已完成订单的押金");
        }

        // 检查是否已退还
        if (booking.getDepositReturned() == 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "押金已退还");
        }

        // 更新退还状态
        booking.setDepositReturned(1);
        booking.setDepositReturnTime(java.time.LocalDateTime.now());

        boolean updated = updateById(booking);
        if (!updated) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "退还押金失败");
        }

        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        String shareTitle = shareItem != null ? shareItem.getTitle() : "共享物品";
        businessNotificationService.sendShareBookingReminder(
                booking.getBorrowerId(),
                "押金已退还",
                String.format("「%s」的押金已退还，请注意查收。", shareTitle),
                booking.getBookingId());

        log.info("押金退还成功, bookingId={}", bookingId);
    }

    @Override
    public ShareItemBookingVO getBookingDetail(Long bookingId) {
        ShareItemBooking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "预约记录不存在");
        }
        return convertToVO(booking);
    }

    @Override
    public IPage<ShareItemBookingVO> getMyBookings(Page<ShareItemBooking> page, Long borrowerId) {
        log.info("查询我的预约列表, borrowerId={}, page={}", borrowerId, page.getCurrent());

        LambdaQueryWrapper<ShareItemBooking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ShareItemBooking::getBorrowerId, borrowerId)
                .orderByDesc(ShareItemBooking::getCreateTime);

        IPage<ShareItemBooking> bookingPage = page(page, wrapper);
        return bookingPage.convert(this::convertToVO);
    }

    @Override
    public IPage<ShareItemBookingVO> getReceivedBookings(Page<ShareItemBooking> page, Long ownerId) {
        log.info("查询收到的预约列表, ownerId={}, page={}", ownerId, page.getCurrent());

        LambdaQueryWrapper<ShareItemBooking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ShareItemBooking::getOwnerId, ownerId)
                .orderByDesc(ShareItemBooking::getCreateTime);

        IPage<ShareItemBooking> bookingPage = page(page, wrapper);
        return bookingPage.convert(this::convertToVO);
    }

    /**
     * 转换为VO
     */
    private ShareItemBookingVO convertToVO(ShareItemBooking booking) {
        ShareItemBookingVO vo = new ShareItemBookingVO();
        BeanUtil.copyProperties(booking, vo);

        // 设置状态描述
        vo.setStatusDesc(getStatusDesc(booking.getStatus()));

        // 设置时间
        if (booking.getCreateTime() != null) {
            vo.setCreateTime(booking.getCreateTime().toString());
        }
        if (booking.getApproveTime() != null) {
            vo.setApproveTime(booking.getApproveTime().toString());
        }
        if (booking.getPayTime() != null) {
            vo.setPayTime(booking.getPayTime().toString());
        }
        if (booking.getReturnTime() != null) {
            vo.setReturnTime(booking.getReturnTime().toString());
        }
        if (booking.getDepositReturnTime() != null) {
            vo.setDepositReturnTime(booking.getDepositReturnTime().toString());
        }

        // 获取共享物品信息
        ShareItem shareItem = shareItemMapper.selectById(booking.getShareId());
        if (shareItem != null) {
            vo.setShareItemTitle(shareItem.getTitle());
            vo.setDailyRent(shareItem.getDailyRent());

            // 获取封面图
            LambdaQueryWrapper<ShareItemImage> imageWrapper =
                new LambdaQueryWrapper<>();
            imageWrapper.eq(ShareItemImage::getShareId, booking.getShareId())
                    .eq(ShareItemImage::getIsCover, 1)
                    .eq(ShareItemImage::getStatus, 0)
                    .last("LIMIT 1");
            ShareItemImage coverImage = shareItemImageMapper.selectOne(imageWrapper);
            if (coverImage != null) {
                vo.setCoverImageUrl(coverImage.getImageUrl());
            }
        }

        // 获取所有者信息
        User owner = userMapper.selectById(booking.getOwnerId());
        if (owner != null) {
            vo.setOwnerNickname(owner.getNickname());
            vo.setOwnerAvatar(owner.getAvatar());
        }

        // 获取借用者信息
        User borrower = userMapper.selectById(booking.getBorrowerId());
        if (borrower != null) {
            vo.setBorrowerNickname(borrower.getNickname());
            vo.setBorrowerAvatar(borrower.getAvatar());
        }

        return vo;
    }

    /**
     * 获取状态描述
     */
    private String getStatusDesc(Integer status) {
        switch (status) {
            case 0:
                return "待审批";
            case 1:
                return "已批准";
            case 2:
                return "已拒绝";
            case 3:
                return "已取消";
            case 4:
                return "借用中";
            case 5:
                return "已完成";
            default:
                return "未知状态";
        }
    }
}

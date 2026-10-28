package com.xx.xianqijava.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.entity.UserFollow;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.mapper.UserFollowMapper;
import com.xx.xianqijava.mapper.UserMapper;
import com.xx.xianqijava.service.UserFollowService;
import com.xx.xianqijava.vo.FollowUserVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 用户关注服务实现类
 */
@Slf4j
@Service
public class UserFollowServiceImpl extends ServiceImpl<UserFollowMapper, UserFollow> implements UserFollowService {

    private final UserMapper userMapper;

    public UserFollowServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public void followUser(Long followerId, Long followingId) {
        // 检查是否尝试关注自己
        if (followerId.equals(followingId)) {
            throw new BusinessException("不能关注自己");
        }

        // 检查被关注用户是否存在
        User followingUser = userMapper.selectById(followingId);
        if (followingUser == null) {
            throw new BusinessException("被关注用户不存在");
        }

        // 检查是否已关注
        LambdaQueryWrapper<UserFollow> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFollowingId, followingId);
        Long count = baseMapper.selectCount(queryWrapper);
        if (count > 0) {
            throw new BusinessException("已关注该用户");
        }

        // 添加关注关系
        UserFollow userFollow = new UserFollow();
        userFollow.setFollowerId(followerId);
        userFollow.setFollowingId(followingId);
        baseMapper.insert(userFollow);

        log.info("用户关注成功, followerId={}, followingId={}", followerId, followingId);
    }

    @Override
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        LambdaQueryWrapper<UserFollow> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFollowingId, followingId);
        baseMapper.delete(queryWrapper);

        log.info("用户取消关注成功, followerId={}, followingId={}", followerId, followingId);
    }

    @Override
    public boolean isFollowing(Long followerId, Long followingId) {
        if (followerId == null || followingId == null) {
            return false;
        }
        LambdaQueryWrapper<UserFollow> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFollowingId, followingId);
        return baseMapper.selectCount(queryWrapper) > 0;
    }

    @Override
    public int countFollowing(Long followerId) {
        return Math.toIntExact(baseMapper.selectCount(
                new LambdaQueryWrapper<UserFollow>()
                        .eq(UserFollow::getFollowerId, followerId)
        ));
    }

    @Override
    public int countFollowers(Long followingId) {
        return Math.toIntExact(baseMapper.selectCount(
                new LambdaQueryWrapper<UserFollow>()
                        .eq(UserFollow::getFollowingId, followingId)
        ));
    }

    @Override
    public IPage<FollowUserVO> getFollowingList(Long followerId, Page<UserFollow> page) {
        // 查询关注记录
        IPage<UserFollow> followPage = baseMapper.selectPage(page,
                new LambdaQueryWrapper<UserFollow>()
                        .eq(UserFollow::getFollowerId, followerId)
                        .orderByDesc(UserFollow::getCreatedAt));

        // 转换为 FollowUserVO，携带该条关注关系的建立时间
        List<FollowUserVO> userInfoList = followPage.getRecords().stream()
                .map(follow -> {
                    User user = userMapper.selectById(follow.getFollowingId());
                    if (user == null) {
                        return null;
                    }
                    return convertToFollowUserVO(user, follow.getCreatedAt());
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 构建新的分页结果
        IPage<FollowUserVO> resultPage = new Page<>(page.getCurrent(), page.getSize(), followPage.getTotal());
        resultPage.setRecords(userInfoList);
        return resultPage;
    }

    @Override
    public IPage<FollowUserVO> getFollowerList(Long followingId, Page<UserFollow> page) {
        // 查询粉丝记录
        IPage<UserFollow> followPage = baseMapper.selectPage(page,
                new LambdaQueryWrapper<UserFollow>()
                        .eq(UserFollow::getFollowingId, followingId)
                        .orderByDesc(UserFollow::getCreatedAt));

        // 转换为 FollowUserVO，携带该条关注关系的建立时间
        List<FollowUserVO> userInfoList = followPage.getRecords().stream()
                .map(follow -> {
                    User user = userMapper.selectById(follow.getFollowerId());
                    if (user == null) {
                        return null;
                    }
                    return convertToFollowUserVO(user, follow.getCreatedAt());
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 构建新的分页结果
        IPage<FollowUserVO> resultPage = new Page<>(page.getCurrent(), page.getSize(), followPage.getTotal());
        resultPage.setRecords(userInfoList);
        return resultPage;
    }

    /**
     * 转换为关注列表用户视图对象。
     *
     * @param user       被关注/粉丝用户
     * @param followTime 该条关注关系建立的时间（来自 UserFollow.createdAt）
     */
    private FollowUserVO convertToFollowUserVO(User user, java.time.LocalDateTime followTime) {
        FollowUserVO vo = new FollowUserVO();
        vo.setId(user.getUserId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setAvatar(user.getAvatar());
        vo.setCreditScore(user.getCreditScore());
        vo.setIsVerified(user.getIsVerified());
        vo.setCollege(user.getCollege());
        vo.setMajor(user.getMajor());
        vo.setFollowTime(followTime == null ? null : followTime.toString());
        return vo;
    }
}

package com.xx.xianqijava.service.impl;

import com.xx.xianqijava.common.ErrorCode;
import com.xx.xianqijava.entity.User;
import com.xx.xianqijava.exception.BusinessException;
import com.xx.xianqijava.mapper.UserMapper;
import com.xx.xianqijava.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户偏好设置服务实现类
 *
 * 偏好字段已合并进 user 表，本实现直接读写 User 聚合的偏好相关列，
 * 不再依赖独立的 user_preference 表。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceServiceImpl implements UserPreferenceService {

    private final UserMapper userMapper;

    @Override
    public User getUserPreference(Long userId) {
        log.info("获取用户偏好设置, userId={}", userId);

        if (userId == null) {
            return null;
        }
        return userMapper.selectById(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User getOrCreateUserPreference(Long userId) {
        log.info("获取或创建用户偏好设置, userId={}", userId);

        User user = getUserPreference(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // 偏好缺省时补齐默认值并落库
        boolean changed = false;
        if (user.getTheme() == null) {
            user.setTheme("light");
            changed = true;
        }
        if (user.getAutoDarkMode() == null) {
            user.setAutoDarkMode(0);
            changed = true;
        }
        if (user.getFontSize() == null) {
            user.setFontSize(16);
            changed = true;
        }
        if (user.getDeviceType() == null) {
            user.setDeviceType("unknown");
            changed = true;
        }
        if (user.getLanguage() == null) {
            user.setLanguage("zh-CN");
            changed = true;
        }
        if (user.getNotificationEnabled() == null) {
            user.setNotificationEnabled(1);
            changed = true;
        }
        if (user.getSoundEnabled() == null) {
            user.setSoundEnabled(1);
            changed = true;
        }
        if (user.getVibrationEnabled() == null) {
            user.setVibrationEnabled(1);
            changed = true;
        }

        if (changed) {
            userMapper.updateById(user);
            log.info("补齐默认用户偏好设置, userId={}", userId);
        }

        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateThemeConfig(Long userId, String theme, Boolean autoDarkMode, Integer fontSize) {
        log.info("更新主题配置, userId={}, theme={}, autoDarkMode={}, fontSize={}",
                userId, theme, autoDarkMode, fontSize);

        // 验证主题值
        if (theme != null && !isValidTheme(theme)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "无效的主题值");
        }

        // 验证字体大小
        if (fontSize != null && (fontSize < 12 || fontSize > 24)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "字体大小必须在12-24之间");
        }

        User user = getOrCreateUserPreference(userId);

        if (theme != null) {
            user.setTheme(theme);
        }
        if (autoDarkMode != null) {
            user.setAutoDarkMode(autoDarkMode ? 1 : 0);
        }
        if (fontSize != null) {
            user.setFontSize(fontSize);
        }

        userMapper.updateById(user);
        log.info("主题配置更新成功, userId={}", userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateNotificationSettings(Long userId, Boolean notificationEnabled,
                                           Boolean soundEnabled, Boolean vibrationEnabled) {
        log.info("更新通知设置, userId={}, notification={}, sound={}, vibration={}",
                userId, notificationEnabled, soundEnabled, vibrationEnabled);

        User user = getOrCreateUserPreference(userId);

        if (notificationEnabled != null) {
            user.setNotificationEnabled(notificationEnabled ? 1 : 0);
        }
        if (soundEnabled != null) {
            user.setSoundEnabled(soundEnabled ? 1 : 0);
        }
        if (vibrationEnabled != null) {
            user.setVibrationEnabled(vibrationEnabled ? 1 : 0);
        }

        userMapper.updateById(user);
        log.info("通知设置更新成功, userId={}", userId);
    }

    /**
     * 验证主题值是否有效
     */
    private boolean isValidTheme(String theme) {
        return "light".equals(theme) || "dark".equals(theme) || "auto".equals(theme);
    }
}

package com.xx.xianqijava.service;

import com.xx.xianqijava.entity.User;

/**
 * 用户偏好设置服务接口
 *
 * 偏好字段已合并进 user 表，本服务直接读写 User 聚合的偏好相关列。
 */
public interface UserPreferenceService {

    /**
     * 获取用户偏好设置
     *
     * @param userId 用户ID
     * @return 用户（携带偏好字段），用户不存在时返回 null
     */
    User getUserPreference(Long userId);

    /**
     * 获取或创建用户偏好设置
     * 用户存在则返回；偏好列缺省时补齐默认值后返回。
     *
     * @param userId 用户ID
     * @return 用户（携带偏好字段）
     */
    User getOrCreateUserPreference(Long userId);

    /**
     * 更新主题配置
     *
     * @param userId       用户ID
     * @param theme        主题
     * @param autoDarkMode 自动深色模式
     * @param fontSize     字体大小
     */
    void updateThemeConfig(Long userId, String theme, Boolean autoDarkMode, Integer fontSize);

    /**
     * 更新通知设置
     *
     * @param userId               用户ID
     * @param notificationEnabled  通知开关
     * @param soundEnabled         提示音开关
     * @param vibrationEnabled     振动开关
     */
    void updateNotificationSettings(Long userId, Boolean notificationEnabled, Boolean soundEnabled, Boolean vibrationEnabled);
}

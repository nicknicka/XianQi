package com.xx.xianqijava.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xx.xianqijava.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

/**
 * 用户Mapper接口
 *
 * 用户偏好、信用扩展等 1:1 字段已合并进 user 表，
 * 相关更新语句以条件更新方式直接作用于 user 表。
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 更新用户最后活跃时间
     */
    @Update("UPDATE user SET last_active_time = #{activeTime}, updated_at = NOW() " +
            "WHERE user_id = #{userId}")
    int updateLastActiveTime(@Param("userId") Long userId, @Param("activeTime") LocalDateTime activeTime);

    /**
     * 更新信用等级
     */
    @Update("UPDATE user SET credit_level = #{creditLevel}, updated_at = NOW() " +
            "WHERE user_id = #{userId}")
    int updateCreditLevel(@Param("userId") Long userId, @Param("creditLevel") String creditLevel);

    /**
     * 更新评价统计
     */
    @Update("UPDATE user SET total_positive_evaluations = #{positive}, " +
            "total_neutral_evaluations = #{neutral}, " +
            "total_negative_evaluations = #{negative}, updated_at = NOW() " +
            "WHERE user_id = #{userId}")
    int updateEvaluationStats(
        @Param("userId") Long userId,
        @Param("positive") Integer positive,
        @Param("neutral") Integer neutral,
        @Param("negative") Integer negative
    );

    /**
     * 更新信用分衰减时间
     */
    @Update("UPDATE user SET last_credit_decay_time = #{decayTime}, updated_at = NOW() " +
            "WHERE user_id = #{userId}")
    int updateDecayTime(@Param("userId") Long userId, @Param("decayTime") LocalDateTime decayTime);
}

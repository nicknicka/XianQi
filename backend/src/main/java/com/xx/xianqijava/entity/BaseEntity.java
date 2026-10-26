package com.xx.xianqijava.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 基础实体类
 * 
 * 注意：BaseEntity 只提供统一的时间字段，不再包含软删除。
 * 需要软删除的实体各自声明 deleted 字段和 @TableLogic。
 * 
 * 时间字段迁移说明：
 * - 标准字段：createdAt / updatedAt（映射数据库 created_at / updated_at）
 * - 兼容方法：getCreateTime() / setCreateTime() / getUpdateTime() / setUpdateTime()
 *   已过期，后续各业务模块逐步迁移到标准命名后删除。
 */
@Data
public class BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ---------- 兼容方法（过期，逐步迁移到 createdAt / updatedAt）----------

    /** @deprecated 请使用 getCreatedAt() */
    @Deprecated
    public LocalDateTime getCreateTime() {
        return createdAt;
    }

    /** @deprecated 请使用 setCreatedAt() */
    @Deprecated
    public void setCreateTime(LocalDateTime createTime) {
        this.createdAt = createTime;
    }

    /** @deprecated 请使用 getUpdatedAt() */
    @Deprecated
    public LocalDateTime getUpdateTime() {
        return updatedAt;
    }

    /** @deprecated 请使用 setUpdatedAt() */
    @Deprecated
    public void setUpdateTime(LocalDateTime updateTime) {
        this.updatedAt = updateTime;
    }
}

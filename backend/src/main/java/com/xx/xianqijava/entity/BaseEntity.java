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
 * 时间字段契约：createdAt / updatedAt（映射数据库 created_at / updated_at）。
 * 与对外接口的命名一致，详见 GLOSSARY.md 的「时间字段契约」。
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
}

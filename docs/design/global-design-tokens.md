# 全局设计 Token 契约

## 真源

移动端全局主题 Token 的运行时真源是 `mobile/src/utils/theme/theme-derive.ts`：

- `ThemeRegistration` 提供浅色主题种子、深色覆盖和两套阴影。
- `resolveTheme()` 生成浅色、深色和字号缩放下的完整 CSS 变量。
- `STATIC_VARS` 承载字号、行高、间距、圆角、动效和 z-index 等共享值。
- `ALPHA_SPECS` 用声明式规则派生主题色和语义色的透明度变体。

所有页面和共享组件只消费 `resolveTheme()` 或 `STATIC_VARS` 输出的规范名称。守卫会把未在运行时真源中声明的名称判定为 undeclared CSS variable，不做兼容映射。

## 规范名称

守卫要求的基线类别如下：

| 类别 | 规范 Token |
| --- | --- |
| 主题色 | `--primary-color`、`--primary-color-light`、`--primary-color-dark`、`--secondary-color`、`--accent-color`、`--success-color`、`--warning-color`、`--danger-color`、`--info-color` |
| 语义背景色 | `--success-color-bg`、`--warning-color-bg`、`--danger-color-bg`、`--info-color-bg` |
| 文字色 | `--text-color-primary`、`--text-color-secondary`、`--text-color-tertiary`、`--text-color-disabled`、`--text-color-inverse` |
| 背景色 | `--bg-color-page`、`--bg-color-card`、`--bg-color-warm`、`--bg-color-disabled`、`--bg-color-overlay` |
| 字号 | `--font-base`、`--font-size-xs`、`--font-size-sm`、`--font-size-base`、`--font-size-lg`、`--font-size-xl`、`--font-size-xxl` |
| 间距 | `--spacing-xs`、`--spacing-sm`、`--spacing-md`、`--spacing-lg`、`--spacing-xl` |
| 边框色 | `--border-color-base`、`--border-color-light`、`--border-color-lighter`、`--border-color-dark` |
| 圆角 | `--border-radius-sm`、`--border-radius-base`、`--border-radius-lg`、`--border-radius-xl`、`--border-radius-pill` |
| 阴影 | `--box-shadow-xs`、`--box-shadow-sm`、`--box-shadow-base`、`--box-shadow-primary`、`--box-shadow-card` |
| 动效 | `--motion-duration-fast`、`--motion-duration-medium`、`--motion-duration-base`、`--motion-duration-slow`、`--motion-ease-standard` |

透明度变体由 `ALPHA_SPECS` 生成，命名格式是 `--{色名}-alpha-{百分比}`，例如 `--primary-color-alpha-10`。当前生成的百分比：

| 来源 | 生成名称与百分比 |
| --- | --- |
| 主色 | `--primary-color-alpha-2/3/5/6/8/10/12/15/20/25/30/40/95` |
| 主色浅色 | `--primary-light-alpha-4/8` |
| 危险色 | `--danger-color-alpha-5/6/8/10/15/20/25/30/35/40/80/95` |
| 成功色 | `--success-color-alpha-5/8/10/15/20/30` |
| 警告色 | `--warning-color-alpha-10/15/20/30/85` |
| 信息色 | `--info-color-alpha-10/20/30/40` |
| 强调色 | `--accent-color-alpha-40` |

运行时真源还可能声明特殊用途 Token；它们同样只能使用真源中的完整名称消费。

## 扩展规则

1. 新增静态通用 Token 时，先在 `STATIC_VARS` 声明；随主题变化的通用 Token 在 `resolveTheme()` 声明。
2. 透明度变体优先加入 `ALPHA_SPECS`，不要手工重复 rgba 值。
3. 新增守卫必需的通用 Token 时，同步加入 `REQUIRED_TOKEN_CATEGORIES` 的对应类别，并更新本文档。
4. 组件内部的局部 CSS 变量可以用规范 Token 作为来源，但不得创建同义的全局 Token。
5. 页面不得引入一次性颜色、字号、间距、圆角、阴影或旧命名；缺少 Token 时先扩展运行时真源。
6. `App.vue` 根节点使用 `--bg-color-page`、`--text-color-primary`、`--font-base` 时必须保留静态 fallback。
7. 修改后运行 `node scripts/check-design-tokens.mjs`；禁止重新加入别名映射或兼容分支。

## 静态守卫

在 `mobile/` 下执行：

```bash
node scripts/check-design-tokens.mjs
```

守卫扫描移动端源码中的 `var()` 引用，检查：

1. 未声明的 CSS 变量。
2. 必需 Token 类别缺失。
3. 页面根节点的关键 Token 缺少静态 fallback。
4. 业务页面是否仍直接依赖 SCSS 默认值。
5. 全局样式和共享组件是否引用固定 SCSS Token 默认值。

`npm run lint` 会先执行该守卫，再运行现有只读 ESLint，因此移动端 CI 已经覆盖本契约。

# 全局设计 Token 契约

## 真源

移动端全局主题 Token 的运行时真源是 `mobile/src/utils/theme/theme-derive.ts`：

- `ThemeRegistration` 提供浅色主题种子、深色覆盖和两套阴影。
- `resolveTheme()` 生成浅色、深色和字号缩放下的完整 CSS 变量。
- `STATIC_VARS` 承载字号、行高、间距、圆角、动效和 z-index 等共享值。
- `ALPHA_SPECS` 用声明式规则派生主题色和语义色的透明度变体。

规范 Token 覆盖颜色、文字、背景、边框、字号、间距、圆角、阴影和动效。新增 Token 先进入运行时真源，再更新守卫的必需类别；不要在页面内再造同义 Token。

## 兼容别名

历史页面仍在使用少量旧命名。当前允许的兼容别名是：

| 兼容别名 | 规范 Token |
| --- | --- |
| `--error-color` | `--danger-color` |
| `--error-color-alpha-10` | `--danger-color-alpha-10` |
| `--primary-alpha-10` | `--primary-color-alpha-10` |
| `--radius-lg` | `--border-radius-lg` |
| `--radius-xl` | `--border-radius-xl` |
| `--radius-pill` | `--border-radius-pill` |
| `--success-color-faded` | `--success-color-bg` |
| `--warning-color-faded` | `--warning-color-bg` |
| `--danger-color-faded` | `--danger-color-bg` |

别名由 `resolveTheme()` 映射到规范变量，禁止组件里自行写第二个值。

## 静态守卫

在 `mobile/` 下执行：

```bash
node scripts/check-design-tokens.mjs
```

守卫扫描移动端源码中的 `var()` 引用，检查：

1. 未声明的 CSS 变量。
2. 未登记的兼容别名。
3. 必需 Token 类别缺失。
4. 页面根节点的关键 Token 缺少静态 fallback。
5. 兼容别名是否在运行时真源中完成映射。
6. 个人、消息、登录及其余业务页面是否仍直接依赖 SCSS 默认值。

`npm run lint` 会先执行该守卫，再运行现有只读 ESLint，因此移动端 CI 已经覆盖本契约。

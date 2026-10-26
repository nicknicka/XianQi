# XianQi 用户端（UniApp）

校园二手交易与共享平台用户端，基于 UniApp + Vue3，支持多端发布。

## 技术栈

- **框架**：UniApp + Vue 3
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **UI 组件**：uni-ui
- **样式**：Sass
- **支持平台**：H5、微信小程序、支付宝小程序、抖音小程序等

## 功能模块

- 🏠 首页（Banner、分类、推荐商品、搜索）
- 🛒 交易市场（商品列表、筛选、详情、发布）
- 🔄 共享中心（共享物品、预约、租借、押金）
- 💬 消息中心（私聊、AI 聊天、快捷回复）
- 👤 个人中心（资料、认证、订单、收藏、设置等 28 个页面）
- 📦 订单管理（创建、列表、详情、评价、退款）
- ⚡ 限时秒杀
- 🎨 多主题切换（6 套可爱风主题）
- ⭐ 信用分系统

## 本地开发

### 环境要求
- Node.js 18+
- npm 或 pnpm
- （可选）HBuilderX（用于小程序开发和发布）

### 快速开始

```bash
# 安装依赖
npm install

# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 支付宝小程序开发
npm run dev:mp-alipay
```

### 构建

```bash
# H5 构建
npm run build:h5

# 微信小程序构建
npm run build:mp-weixin
```

构建产物位置：
- H5: `dist/build/h5/`
- 微信小程序: `dist/build/mp-weixin/`

## 支持的平台

| 平台 | 开发命令 | 构建命令 |
|------|---------|---------|
| H5 | `npm run dev:h5` | `npm run build:h5` |
| 微信小程序 | `npm run dev:mp-weixin` | `npm run build:mp-weixin` |
| 支付宝小程序 | `npm run dev:mp-alipay` | `npm run build:mp-alipay` |
| 抖音小程序 | `npm run dev:mp-toutiao` | `npm run build:mp-toutiao` |
| 百度小程序 | `npm run dev:mp-baidu` | `npm run build:mp-baidu` |
| QQ 小程序 | `npm run dev:mp-qq` | `npm run build:mp-qq` |
| ... | ... | ... |

> 注：Docker 部署仅包含 H5 版本。小程序需要使用 HBuilderX 或 CLI 单独构建发布。

## 环境变量

| 变量 | 开发默认值 | 说明 |
|------|-----------|------|
| `VITE_API_BASE_URL` | http://localhost:8080/api | API 基础地址 |
| `VITE_WS_BASE_URL` | ws://localhost:8080/api/ws | WebSocket 地址 |
| `VITE_OSS_ENABLED` | false | 是否启用阿里云 OSS |
| `VITE_UPLOAD_BASE_URL` | /api/uploads | 文件上传地址 |
| `VITE_AMAP_WEB_KEY` | - | 高德地图 Web Key |
| `VITE_AMAP_MINIPROGRAM_KEY` | - | 高德地图小程序 Key |
| `VITE_APP_TITLE` | 闲七校园 | 应用标题 |

## 项目结构

```
src/
├── api/             # API 接口层（25 个模块）
├── components/      # 自定义组件（50+）
├── composables/     # Vue 组合式函数
├── constants/       # 常量定义
├── hooks/           # 自定义 Hooks
├── pages/           # 页面（12 个功能模块）
│   ├── index/       # 首页
│   ├── market/      # 交易市场
│   ├── share/       # 共享中心
│   ├── message/     # 消息
│   ├── mine/        # 我的
│   ├── order/       # 订单
│   ├── search/      # 搜索
│   ├── login/       # 登录
│   ├── user/        # 用户主页
│   └── ...
├── services/        # 业务服务层
├── store/           # Pinia 状态管理
├── styles/          # 全局样式
├── utils/           # 工具函数（30+ 模块）
├── types/           # TypeScript 类型定义
├── static/          # 静态资源
├── App.vue
├── main.js
├── manifest.json    # UniApp 配置
└── pages.json       # 页面路由配置
```

## Docker 部署

H5 版本通过 Docker 部署，见根目录 [部署指南](../docs/deployment.md)。

访问地址：`http://xianqi.local/h5/`

## 注意事项

1. **小程序构建**：微信小程序等平台的构建不在 Docker 范围内，需使用 HBuilderX 或 CLI 工具单独发布
2. **地图服务**：H5 使用腾讯地图，小程序使用高德地图，需要分别配置 Key
3. **主题系统**：6 套主题预设，配置在 `src/utils/theme-presets.ts`
4. **信用系统**：信用分规则定义在 `src/constants/credit.ts`

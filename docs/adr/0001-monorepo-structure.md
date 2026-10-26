# ADR-0001: 采用 Monorepo 单仓库结构

## 状态
已采纳

## 背景
XianQi 平台原分为三个独立仓库：
- XianQiJava - Spring Boot 后端
- XianQiAdmin - Vue3 管理后台
- XianQiUniapp - UniApp 用户端

三个仓库独立管理存在以下问题：
1. 部署配置分散，需要分别维护
2. 跨仓库修改需要多次提交和 PR
3. 版本号和发布节奏难以同步
4. 新成员上手需要 clone 多个仓库

## 决策
采用 Monorepo（单仓库）结构，将三个项目合并到 `nicknicka/XianQi` 仓库中，按目录分区：
- `backend/` - 后端
- `admin/` - 管理后台前端
- `mobile/` - 用户端（H5 + 小程序）

不引入额外的 monorepo 工具（如 pnpm workspaces、Nx、Turborepo），使用纯目录分区 + docker-compose 统一编排。

## 理由
1. **三个项目技术栈差异大**：Java/Maven vs 两个前端/npm，代码几乎不共享，不需要 workspace 级别的依赖管理
2. **Docker Compose 已经能统一编排**：部署层面 compose 已足够
3. **降低复杂度**：不引入额外工具链，减少学习成本和维护负担
4. **保持独立开发体验**：每个子项目仍可独立开发、独立运行
5. **Git 历史从新开始**：三个仓库历史不算长，干净的起点胜过复杂的历史合并

## 后果
### 正面
- 一个仓库就能获取全部代码
- 部署配置集中管理
- 跨端修改可以在一个 PR 中完成
- Issue 和 Project 可以统一管理

### 负面
- Git 提交历史混合，三个项目的改动在同一个 log 里
- 仓库体积会比单个项目大
- 如果未来团队扩大，可能需要更细粒度的权限控制

## 备选方案
- **多仓库 + git submodule**：保留独立仓库，用 submodule 关联。缺点是 submodule 使用复杂，容易出错。
- **pnpm workspaces**：只管理前端两个项目。但后端是 Java，用不上，收益有限。

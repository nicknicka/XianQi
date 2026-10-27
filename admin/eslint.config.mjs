// ESLint v9 flat config（管理后台，issue #9）
// 最小但真实的约束：ES 推荐 + TypeScript 推荐 + Vue essential，只抓真实缺陷，
// 不做历史代码风格重排。生成文件显式忽略，不忽略整个 src。
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      // unplugin-auto-import / unplugin-vue-components 生成的类型声明
      'src/auto-imports.d.ts',
      'src/components.d.ts',
      // Vite 加载配置时创建的短生命周期临时文件，可能与 lint 扫描发生竞态
      'vite.config.ts.timestamp-*',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // essential：模板解析、指令误用等真实缺陷规则，不含风格类规则
  ...pluginVue.configs['flat/essential'],
  {
    // <script setup lang="ts"> 与普通 .ts 由 TS 解析器处理
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // 浏览器端应用代码：允许 console/window/document/localStorage 等 DOM 全局
    files: ['src/**/*.{ts,tsx,vue,js}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // 项目约定：页面统一为 views/<功能>/index.vue（配合路由），
      // 与“组件名必须多词”规则天然冲突，该约定下关闭此规则。
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // catch(error) 中不使用错误对象是有意为之（历史代码普遍如此），
          // 仍严格检查普通变量/参数/导入；下划线前缀用于 rest 剔除等“故意忽略”。
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      // 历史代码存在 25 处 any（多为 API 边界）。保留为 warning：输出可见、
      // 不阻断门禁；类型收窄属于独立的类型治理任务，不在本 ticket 内重写。
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Node 侧配置/脚本（vite.config.ts 及未来的 *.js/*.mjs/*.cjs）
    files: ['*.{js,cjs,mjs,ts}', 'scripts/**/*.{js,cjs,mjs,ts}'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },
)

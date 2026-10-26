import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      'dist/**',
      'unpackage/**',
      'node_modules/**',
      'static/fontclass/**',
      // iconfont 生成产物：只忽略这一个文件，保留 src/static 其余代码的检查
      'src/static/symbols/iconfont.js'
    ]
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        App: 'readonly',
        Component: 'readonly',
        Page: 'readonly',
        getApp: 'readonly',
        getCurrentPages: 'readonly',
        uni: 'readonly',
        wx: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      // UniApp 内置 view 在 Vue 解析器中会被识别为组件；H5 条件分支需要 v-html。
      'vue/no-v-text-v-html-on-component': ['error', { allow: ['view'] }],
      // Vue 的类型扩展接口通过空接口做 declaration merging（见 shims-uni.d.ts）。
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowWithName: '^ComponentCustomOptions$' }
      ],
      // TransitionType 的高级效果是对运行时已有动画名的语义别名；改变值会改变页面行为。
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': ['error', { htmlElementCaseSensitive: true }]
    }
  },
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      'no-undef': 'off'
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    }
  },
  prettier
]

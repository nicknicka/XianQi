/**
 * Vue 单文件组件的类型声明。
 *
 * `tsc` 不解析 .vue 文件，缺少此声明时所有 `import ... from './x.vue'`
 * 都会报 TS2307。构建链（vite + unplugin-vue-components）不受影响，
 * 但类型检查需要它。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // 用 Record<string, never> 表达「无 props / 无显式暴露」，
  // 避免 lint 的 no-empty-object-type 规则（{} 会放宽到任意非空值）。
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

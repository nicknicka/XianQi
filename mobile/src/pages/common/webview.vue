<template>
  <view class="webview-page">
    <web-view :src="url" @message="handleMessage" />
  </view>
</template>

<script setup lang="ts">
import { useThemePage } from '@/utils/theme'
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const url = ref('')

onShow(() => {
  useThemePage()
})


onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.url) {
    url.value = decodeURIComponent(options.url)
  } else {
    uni.showToast({ title: '链接无效', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

function handleMessage(e: any) {
  console.log('收到 webview 消息:', e.detail)
}
</script>

<style lang="scss" scoped>
.webview-page {
  width: 100%;
  height: 100vh;
}
</style>

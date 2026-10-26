<template>
  <SourceCustomTabBar ref="tabBarRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SourceCustomTabBar from '../src/custom-tab-bar/index.vue'

const tabBarRef = ref<any>(null)

function setBadge(index: number, badge: string | number) {
  tabBarRef.value?.setBadge?.(index, badge)
}

function setCurrentIndex(index: number) {
  tabBarRef.value?.setCurrentIndex?.(index)
}

defineExpose({
  setBadge,
  $setBadge: setBadge,
  setCurrentIndex,
  $setCurrentIndex: setCurrentIndex
})
</script>
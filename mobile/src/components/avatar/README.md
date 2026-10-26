# Avatar 组件使用说明

## 组件说明

本项目包含两个头像相关组件：

1. **Avatar** - 通用图片/缩略图组件
2. **UserAvatar** - 用户头像组件（基于 Avatar 封装，增加用户相关特性）

## 1. Avatar 组件

通用图片显示组件，适用于商品缩略图、图片预览等场景。

### 基础用法

```vue
<template>
  <!-- 基础用法 -->
  <Avatar :src="imageUrl" />

  <!-- 指定尺寸 -->
  <Avatar :src="imageUrl" size="lg" />

  <!-- 方形头像 -->
  <Avatar :src="imageUrl" shape="square" />

  <!-- 圆角方形 -->
  <Avatar :src="imageUrl" shape="rounded" />

  <!-- 可点击 -->
  <Avatar :src="imageUrl" clickable @click="handleClick" />
</template>

<script setup lang="ts">
import Avatar from '@/components/avatar/avatar.vue'
</script>
```

### Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| src | 图片地址 | string | - | '' |
| defaultSrc | 默认图片地址 | string | - | '/static/images/default.png' |
| size | 尺寸 | string | xs / sm / md / lg / xl / xxl | md |
| shape | 形状 | string | circle / square / rounded | square |
| mode | 图片裁剪模式 | string | aspectFill / aspectFit / widthFix / heightFix | aspectFill |
| lazyLoad | 是否懒加载 | boolean | - | true |
| clickable | 是否可点击 | boolean | - | false |
| width | 自定义宽度 | string \| number | - | - |
| height | 自定义高度 | string \| number | - | - |
| customStyle | 自定义样式 | string \| object | - | - |

### 尺寸对应

- xs: 48rpx
- sm: 64rpx
- md: 80rpx
- lg: 120rpx
- xl: 160rpx
- xxl: 200rpx

### Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| click | 点击图片时触发 | event: Event |
| load | 图片加载成功 | event: Event |
| error | 图片加载失败 | event: Event |

---

## 2. UserAvatar 组件

专门用于用户头像的组件，支持在线状态指示、默认头像等用户相关特性。

### 基础用法

```vue
<template>
  <!-- 基础用法 -->
  <UserAvatar :src="user.avatar" />

  <!-- 带在线状态 -->
  <UserAvatar
    :src="user.avatar"
    :show-online="true"
    :is-online="user.isOnline"
  />

  <!-- 可点击的头像 -->
  <UserAvatar
    :src="user.avatar"
    size="lg"
    clickable
    @click="viewUserProfile"
  />

  <!-- 自定义尺寸 -->
  <UserAvatar
    :src="user.avatar"
    width="100"
    height="100"
  />

  <!-- 方形头像 -->
  <UserAvatar
    :src="user.avatar"
    shape="rounded"
  />
</template>

<script setup lang="ts">
import UserAvatar from '@/components/user-avatar/user-avatar.vue'

function viewUserProfile() {
  uni.navigateTo({
    url: `/pages/user/home?id=${user.id}`
  })
}
</script>
```

### Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| src | 用户头像URL | string | - | '' |
| size | 头像尺寸 | string | xs / sm / md / lg / xl / xxl | md |
| shape | 头像形状 | string | circle / square / rounded | circle |
| mode | 图片裁剪模式 | string | aspectFill / aspectFit / widthFix / heightFix | aspectFill |
| lazyLoad | 是否懒加载 | boolean | - | true |
| clickable | 是否可点击 | boolean | - | false |
| showOnline | 是否显示在线状态 | boolean | - | false |
| isOnline | 是否在线 | boolean | - | false |
| width | 自定义宽度 | string \| number | - | - |
| height | 自定义高度 | string \| number | - | - |
| customStyle | 自定义样式 | string \| object | - | - |

### Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| click | 点击头像时触发 | event: Event |
| load | 图片加载成功 | event: Event |
| error | 图片加载失败 | event: Event |

---

## 3. 实际应用示例

### 在用户个人资料页

```vue
<!-- src/pages/mine/profile.vue -->
<template>
  <view class="avatar-section">
    <UserAvatar
      :src="userInfo.avatar"
      size="xl"
      clickable
      @click="changeAvatar"
    />
    <text class="avatar-tip">点击更换头像</text>
  </view>
</template>
```

### 在用户卡片组件

```vue
<!-- src/components/user-card/user-card.vue -->
<template>
  <view class="user-card" @click="handleClick">
    <UserAvatar :src="user.avatar" size="md" shape="circle" />
    <view class="user-info">
      <text class="name">{{ user.nickname }}</text>
    </view>
  </view>
</template>
```

### 在聊天页面

```vue
<!-- src/pages/message/chat.vue -->
<template>
  <view class="message-item">
    <!-- 对方头像 -->
    <UserAvatar
      v-if="!message.isSelf"
      :src="targetUser.avatar"
      size="sm"
      :show-online="true"
      :is-online="targetUser.isOnline"
    />

    <!-- 消息气泡 -->
    <view class="bubble">{{ message.content }}</view>

    <!-- 我的头像 -->
    <UserAvatar
      v-if="message.isSelf"
      :src="currentUser.avatar"
      size="sm"
    />
  </view>
</template>
```

### 在首页用户信息

```vue
<!-- src/pages/mine/index.vue -->
<template>
  <view class="user-card">
    <UserAvatar
      :src="userStore.avatar"
      size="lg"
      shape="rounded"
      :show-online="true"
      :is-online="isOnline"
      clickable
      @click="handleChangeAvatar"
    />
    <view class="user-info">
      <text class="nickname">{{ userStore.nickname }}</text>
    </view>
  </view>
</template>
```

### 在商品列表

```vue
<!-- 商品缩略图 -->
<template>
  <view class="product-item">
    <Avatar
      :src="product.coverImage"
      size="lg"
      shape="square"
      clickable
      @click="viewProduct"
    />
    <text class="product-title">{{ product.title }}</text>
  </view>
</template>
```

---

## 4. 全局导入

组件已在 `src/components/index.ts` 中导出，可以按需导入：

```typescript
import { Avatar, UserAvatar } from '@/components'
```

或单独导入：

```typescript
import Avatar from '@/components/avatar/avatar.vue'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
```

---

## 5. 样式定制

组件使用 CSS 变量，可以通过修改主题色来自定义：

```scss
:root {
  --bg-color-light: #f5f5f5;
  --bg-color-card: #fff;
  --border-radius-md: 8rpx;
}
```

---

## 6. 注意事项

1. **默认头像**：
   - Avatar 组件默认使用 `/static/images/default.png`
   - UserAvatar 组件默认使用 `/static/images/user.png`

2. **图片错误处理**：
   - 组件内置错误处理，加载失败时会显示占位图标
   - 可以通过监听 `error` 事件自定义处理

3. **性能优化**：
   - 默认开启懒加载（lazyLoad: true）
   - 建议在列表中使用时保持懒加载开启

4. **在线状态**：
   - UserAvatar 的在线状态指示器仅在 `showOnline=true` 时显示
   - 需要配合后端实时更新用户的在线状态

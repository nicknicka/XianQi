<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <div class="logo">
        <h3>管理后台</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>

        <el-sub-menu index="business">
          <template #title>
            <el-icon><Briefcase /></el-icon>
            <span>业务管理</span>
          </template>
          <el-menu-item index="/admin/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/product">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/order">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/shareitem">
            <el-icon><Share /></el-icon>
            <span>共享物品管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/authManage">
            <el-icon><Checked /></el-icon>
            <span>实名认证管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="content">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/admin/banner">
            <el-icon><Picture /></el-icon>
            <span>轮播图管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/category">
            <el-icon><FolderOpened /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/sensitiveWord">
            <el-icon><Hide /></el-icon>
            <span>敏感词管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/notification">
            <el-icon><Bell /></el-icon>
            <span>系统通知管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/flashSale">
            <el-icon><Timer /></el-icon>
            <span>秒杀管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="interaction">
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>互动管理</span>
          </template>
          <el-menu-item index="/admin/evaluation">
            <el-icon><ChatDotRound /></el-icon>
            <span>评价管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/feedback">
            <el-icon><ChatLineSquare /></el-icon>
            <span>用户反馈</span>
          </el-menu-item>
          <el-menu-item index="/admin/report">
            <el-icon><Warning /></el-icon>
            <span>举报管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/blacklist">
            <el-icon><Lock /></el-icon>
            <span>黑名单管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/admin/operationLog">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
          <el-menu-item index="/admin/systemConfig">
            <el-icon><Tools /></el-icon>
            <span>系统配置</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header>
        <div class="header-content">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-icon><User /></el-icon>
                {{ adminStore.adminInfo?.nickname || '管理员' }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  Goods,
  Document,
  Checked,
  Bell,
  Timer,
  FolderOpened,
  Hide,
  Warning,
  Share,
  Picture,
  Lock,
  ChatDotRound,
  Setting,
  ChatLineSquare,
  Briefcase,
  Grid,
  Tools,
  ArrowDown
} from '@element-plus/icons-vue'
import { useAdminStore } from '@/store/admin'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title as string || '首页')

onMounted(async () => {
  if (adminStore.isLoggedIn) {
    await adminStore.getAdminInfo()
  }
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await adminStore.logout()
    ElMessage.success('退出成功')
    router.push('/admin/login')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100%;
}

.el-aside {
  background-color: #304156;
  color: #fff;

  .logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    border-bottom: 1px solid #1f2d3d;
  }

  .el-menu {
    border-right: none;
  }
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;

  .header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .el-dropdown-link {
        display: flex;
        align-items: center;
        gap: 5px;
      }
    }
  }
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto; // 添加垂直滚动，避免外层出现滚动条
  height: calc(100vh - 60px); // 减去 header 高度
}
</style>

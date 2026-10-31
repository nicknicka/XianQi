<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { themeManager } from "@/utils/theme";
import { useUserStore } from "@/store/user";
import { messageService } from "@/services/message.service";

// 启动早期预注入主题变量，尽量避免首屏使用未初始化样式导致闪烁
bootstrapThemeEarly();

function bootstrapThemeEarly() {
	try {
		themeManager.applyTheme();
		themeManager.applyBackgroundColor();
	} catch (e) {
		console.warn("[App] 启动早期预注入主题失败:", e);
	}
}

onLaunch(() => {
	console.log("App Launch");

	// 尽早设置背景色，避免页面加载时闪烁默认背景色
	try {
		themeManager.applyBackgroundColor();
	} catch (_e) {
		// 静默忽略
	}
	// 应用启动时检查登录状态和 Token 有效性
	checkLoginStatus();
	// 初始化消息服务
	initMessageService();
	// 同步应用主题（三层字典架构，resolveTheme 纯计算无异步依赖）
	try {
		themeManager.applyTheme();
	} catch (e) {
		console.error("应用主题失败:", e);
	}
	// 添加全局错误处理，捕获微信小程序安全API错误
	setupGlobalErrorHandler();
});

/**
 * 设置全局错误处理器（捕获微信小程序安全API错误）
 */
function setupGlobalErrorHandler() {
	// #ifdef MP-WEIXIN
	try {
		const originalConsoleError = console.error;
		console.error = function (...args: any[]) {
			const message = args[0];

			// 检查是否是安全API失败的错误（开发工具中常见，真机上不会出现）
			if (
				typeof message === "string" &&
				(message.includes("webapi_getwxaasyncsecinfo:fail") ||
					message.includes("getWxaAsyncSecInfo:fail"))
			) {
				console.warn("[App] 安全API调用失败（开发工具中正常，真机不会出现）");
				return;
			}

			originalConsoleError.apply(console, args);
		};
		console.log("[App] 全局错误处理器已设置");
	} catch (e) {
		console.error("[App] 设置全局错误处理器失败:", e);
	}
	// #endif
}

onShow(() => {
	console.log("App Show");
	// 尽早设置背景色，避免页面显示时闪烁
	try {
		themeManager.applyBackgroundColor();
	} catch (_e) {
		// 静默忽略
	}
	// 页面显示时重新应用主题（确保主题生效）
	try {
		themeManager.applyTheme();
	} catch (e) {
		console.error("应用主题失败:", e);
	}
	// 连接 WebSocket
	if (messageService.getConnectionStatus() === false) {
		const userStore = useUserStore();
		if (userStore.token) {
			messageService.connect();
		}
	}
});

onHide(() => {
	console.log("App Hide");
	// 应用进入后台时保持 WebSocket 连接
	// 这样可以在后台接收新消息的推送通知
});

function checkLoginStatus() {
	try {
		const userStore = useUserStore();

		// 检查 Token 有效性
		if (userStore.token) {
			console.log("[App] 发现本地 Token，开始验证...");

			// 验证 Token 是否有效
			const isValid = userStore.validateToken();

			if (!isValid) {
				console.warn("[App] Token 无效或已过期，清除登录状态");
				// 只清除数据，不跳转（登录页已经是首页）
				userStore.clearAuthState();
			} else {
				console.log("[App] Token 验证通过，跳转到首页");
				// 已登录，跳转到首页
				setTimeout(() => {
					uni.switchTab({ url: "/pages/index/index" });
				}, 100);
			}
		} else {
			console.log("[App] 未发现本地 Token，停留在登录页");
		}
	} catch (e) {
		console.error("[App] 检查登录状态失败:", e);
	}
}

/**
 * 初始化消息服务
 */
function initMessageService() {
	try {
		const userStore = useUserStore();
		if (userStore.token) {
			console.log("[App] 初始化消息服务");
			messageService.init();
			// 延迟连接，确保应用启动完成
			setTimeout(() => {
				messageService.connect();
			}, 500);
		}
	} catch (e) {
		console.error("[App] 初始化消息服务失败:", e);
	}
}
</script>

<template>
	<view />
</template>

<style lang="scss">
/* 全局样式 */
@use '@/styles/common.scss' as *;
@use '@/styles/theme-cute.scss' as *;
@use '@/styles/service-redesign.scss' as *;

/* 主题变量 - 使用 CSS 变量实现动态主题 */
page {
	/* 使用 CSS 变量 */
	background-color: var(--bg-color-page, #F0F8FF);
	font-size: var(--font-base, 14px);
	line-height: 1.6;
	color: var(--text-color-primary, #2D2D2D);
	/* 确保页面内容不会溢出 */
	overflow-x: hidden;
	/* 禁用弹性回弹，防止滚动到底部/顶部时露出原生背景色条 */
	overscroll-behavior: none;
	width: 100%;
	transition: background-color 0.22s ease, color 0.22s ease;
}

html,
body,
#app {
	min-height: 100%;
	background-color: var(--bg-color-page, #F0F8FF);
	color: var(--text-color-primary, #2D2D2D);
	transition: background-color 0.22s ease, color 0.22s ease;
}

/* #ifdef H5 */
uni-tabbar,
.uni-tabbar {
	display: none !important;
}

@media (min-width: 768px) {
	body {
		overflow-x: hidden;
	}

	#app {
		width: min(100vw, 430px);
		margin: 0 auto;
		position: relative;
		overflow-x: hidden;
		box-shadow: 0 0 40px rgba(30, 64, 105, 0.12);
	}

	uni-page,
	uni-page-wrapper,
	uni-page-body {
		width: 100% !important;
		max-width: 430px;
		margin: 0 auto;
		overflow-x: hidden;
	}

	uni-page-head,
	.uni-page-head {
		left: 50% !important;
		right: auto !important;
		width: 430px !important;
		max-width: 100vw;
		margin-left: -215px;
	}

	html,
	body,
	#app,
	uni-page,
	uni-page-wrapper,
	uni-page-body,
	scroll-view {
		scrollbar-width: none;
	}

	html::-webkit-scrollbar,
	body::-webkit-scrollbar,
	#app::-webkit-scrollbar,
	uni-page::-webkit-scrollbar,
	uni-page-wrapper::-webkit-scrollbar,
	uni-page-body::-webkit-scrollbar,
	scroll-view::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}
}
/* #endif */

/* 全局按钮样式使用主题色 */
button {
	background: var(--primary-color);
}

/* 修复 uni-popup 弹窗横向超出问题 */
::v-deep uni-popup {
	/* 确保弹窗容器不超出屏幕 */
	max-width: 100vw;
	overflow: hidden;
}

::v-deep .uni-popup__wrapper {
	/* 确保弹窗包装器不超出屏幕 */
	max-width: 100vw;
	overflow: hidden;
	box-sizing: border-box;
}

/* 底部弹窗特定修复 */
::v-deep uni-popup[type="bottom"] .uni-popup__wrapper {
	width: 100%;
	max-width: 100vw;
	left: 0;
	right: 0;
	box-sizing: border-box;
}

/* 居中弹窗特定修复 */
::v-deep uni-popup[type="center"] .uni-popup__wrapper {
	max-width: calc(100vw - 64rpx);
	box-sizing: border-box;
}

/* 确保弹窗内部内容不超出 */
::v-deep .uni-popup__wrapper-box {
	max-width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}
</style>

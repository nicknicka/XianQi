<template>
  <view class="privacy-page">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="隐私政策"
      :show-back="true"
      background-color="#ffffff"
      text-color="#333333"
    />

    <scroll-view class="content" scroll-y>
      <view class="privacy-content">
        <view class="privacy-title">闲七校园隐私政策</view>

        <view class="update-time">最后更新日期：2024年1月1日</view>

        <view class="privacy-intro">
          <text class="intro-text">闲七校园（以下简称"我们"）非常重视用户的隐私保护和个人信息安全。本隐私政策将帮助您了解我们如何收集、使用、存储和保护您的个人信息。请您仔细阅读并充分理解本政策内容。</text>
        </view>

        <view class="privacy-section">
          <view class="section-title">一、我们收集的信息</view>
          <view class="section-content">
            <text class="content-text">1.1 账号信息</text>
            <text class="content-text indent">· 学号：用于身份验证和实名认证</text>
            <text class="content-text indent">· 手机号：用于注册登录和安全验证</text>
            <text class="content-text indent">· 密码：经过加密存储的登录凭证</text>
            <text class="content-text">1.2 个人信息</text>
            <text class="content-text indent">· 昵称、头像：用于身份展示</text>
            <text class="content-text indent">· 学院、年级：用于用户分类和推荐</text>
            <text class="content-text indent">· 性别：用于个性化服务</text>
            <text class="content-text">1.3 交易信息</text>
            <text class="content-text indent">· 发布的商品信息</text>
            <text class="content-text indent">· 订单记录和交易详情</text>
            <text class="content-text indent">· 收货地址</text>
            <text class="content-text">1.4 设备信息</text>
            <text class="content-text indent">· 设备型号、操作系统版本</text>
            <text class="content-text indent">· 设备标识符（如IMEI、IDFA等）</text>
            <text class="content-text indent">· 网络类型和IP地址</text>
            <text class="content-text">1.5 位置信息</text>
            <text class="content-text indent">· 商品发布时的地理位置</text>
            <text class="content-text indent">· 用于推荐附近的交易和共享服务</text>
            <text class="content-text">1.6 日志信息</text>
            <text class="content-text indent">· 操作记录和访问日志</text>
            <text class="content-text indent">· 搜索和浏览历史</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">二、信息的使用目的</view>
          <view class="section-content">
            <text class="content-text">2.1 提供服务</text>
            <text class="content-text indent">· 用户注册、登录和身份验证</text>
            <text class="content-text indent">· 商品发布、搜索和交易撮合</text>
            <text class="content-text indent">· 订单管理和物流配送</text>
            <text class="content-text">2.2 安全保护</text>
            <text class="content-text indent">· 账号安全防护和欺诈检测</text>
            <text class="content-text indent">· 交易风险控制</text>
            <text class="content-text">2.3 产品优化</text>
            <text class="content-text indent">· 改善产品功能和用户体验</text>
            <text class="content-text indent">· 分析产品使用情况</text>
            <text class="content-text">2.4 个性化推荐</text>
            <text class="content-text indent">· 推荐您可能感兴趣的商品</text>
            <text class="content-text indent">· 推荐附近的服务</text>
            <text class="content-text">2.5 消息推送</text>
            <text class="content-text indent">· 交易状态通知</text>
            <text class="content-text indent">· 系统公告和活动信息</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">三、信息的共享与披露</view>
          <view class="section-content">
            <text class="content-text">我们承诺不会向第三方出售您的个人信息。在以下情况下，我们可能会共享您的信息：</text>
            <text class="content-text">3.1 经您同意</text>
            <text class="content-text indent">· 在获得您明确同意的情况下</text>
            <text class="content-text">3.2 交易必要</text>
            <text class="content-text indent">· 为完成交易，向交易对方提供必要信息（如收货地址）</text>
            <text class="content-text">3.3 法律法规要求</text>
            <text class="content-text indent">· 根据法律法规或政府主管部门要求</text>
            <text class="content-text">3.4 保护用户权益</text>
            <text class="content-text indent">· 为维护用户或社会公共利益</text>
            <text class="content-text">3.5 第三方服务</text>
            <text class="content-text indent">· 与提供技术支持、支付服务的合作伙伴共享必要信息</text>
            <text class="content-text indent">· 我们会与合作伙伴签署严格的保密协议</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">四、信息的存储与保护</view>
          <view class="section-content">
            <text class="content-text">4.1 存储地点</text>
            <text class="content-text indent">· 您的个人信息存储在中华人民共和国境内</text>
            <text class="content-text">4.2 存储期限</text>
            <text class="content-text indent">· 账号期间持续存储</text>
            <text class="content-text indent">· 注销账号后保留法律法规要求的最短期限</text>
            <text class="content-text">4.3 保护措施</text>
            <text class="content-text indent">· 数据加密传输和存储</text>
            <text class="content-text indent">· 访问权限控制</text>
            <text class="content-text indent">· 安全审计和漏洞修复</text>
            <text class="content-text indent">· 建立应急预案和数据备份机制</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">五、您的权利</view>
          <view class="section-content">
            <text class="content-text">您对自己的个人信息享有以下权利：</text>
            <text class="content-text">5.1 访问权</text>
            <text class="content-text indent">· 您可以随时查看您的个人信息</text>
            <text class="content-text">5.2 更正权</text>
            <text class="content-text indent">· 您可以修改或更新您的个人信息</text>
            <text class="content-text">5.3 删除权</text>
            <text class="content-text indent">· 您可以要求删除您的个人信息</text>
            <text class="content-text indent">· 在特定条件下（如信息收集违法、目的已实现等），我们会主动删除</text>
            <text class="content-text">5.4 注销权</text>
            <text class="content-text indent">· 您可以申请注销账号</text>
            <text class="content-text indent">· 注销后，您的个人信息将被删除或匿名化处理</text>
            <text class="content-text">5.5 撤回同意</text>
            <text class="content-text indent">· 您可以撤回之前对信息处理的同意</text>
            <text class="content-text indent">· 但撤回同意不影响撤回前已进行的合法处理</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">六、未成年人的保护</view>
          <view class="section-content">
            <text class="content-text">6.1 本平台主要面向高校学生用户</text>
            <text class="content-text">6.2 如果您是未满18周岁的未成年人，请在监护人的陪同下阅读和使用本服务</text>
            <text class="content-text">6.3 我们不会主动收集未成年人的个人信息</text>
            <text class="content-text">6.4 如我们发现收集了未成年人信息，会尽快采取措施删除</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">七、Cookie 和类似技术</view>
          <view class="section-content">
            <text class="content-text">7.1 为确保服务正常运行，我们会在您的设备上存储小型数据文件（Cookie）</text>
            <text class="content-text">7.2 Cookie 的作用包括：</text>
            <text class="content-text indent">· 记住您的登录状态</text>
            <text class="content-text indent">· 分析应用使用情况</text>
            <text class="content-text indent">· 提供个性化服务</text>
            <text class="content-text">7.3 您可以通过设备设置管理或删除 Cookie</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">八、隐私政策的变更</view>
          <view class="section-content">
            <text class="content-text">8.1 我们可能不时修订本隐私政策</text>
            <text class="content-text">8.2 重大变更时，我们会通过显著方式通知您</text>
            <text class="content-text indent">· 在应用内弹窗提示</text>
            <text class="content-text indent">· 发送系统通知</text>
            <text class="content-text indent">· 在本页面顶部标注更新日期</text>
            <text class="content-text">8.3 继续使用服务即表示您同意修订后的政策</text>
          </view>
        </view>

        <view class="privacy-section">
          <view class="section-title">九、联系我们</view>
          <view class="section-content">
            <text class="content-text">如您对本隐私政策有任何疑问、意见或建议，或需要行使您的个人信息权利，请通过以下方式联系我们：</text>
            <text class="content-text">· 邮箱：privacy@xianqi.com</text>
            <text class="content-text">· 客服电话：400-xxx-xxxx</text>
            <text class="content-text">· 联系地址：xx省xx市xx区xx路xx号</text>
            <text class="content-text">我们会在15个工作日内回复您的请求。</text>
          </view>
        </view>

        <view class="privacy-footer">
          <text class="footer-text">感谢您信任并使用闲七校园！</text>
          <text class="footer-text">我们将持续努力保护您的个人信息安全。</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style lang="scss" scoped>
.privacy-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  height: 100vh;
}

.privacy-content {
  padding: 32rpx 24rpx;
}

.privacy-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary);
  text-align: center;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.update-time {
  text-align: center;
  font-size: 24rpx;
  color: var(--text-color-tertiary);
  margin-bottom: 32rpx;
}

.privacy-intro {
  background: var(--warning-color-alpha-10);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-left: 4rpx solid var(--primary-color);
}

.intro-text {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  line-height: 1.8;
}

.privacy-section {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid var(--border-color-light);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.content-text {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  line-height: 1.8;
  word-break: break-all;

  &.indent {
    padding-left: 40rpx;
    position: relative;

    &::before {
      content: '·';
      position: absolute;
      left: 16rpx;
      top: 0;
      color: var(--primary-color);
      font-weight: bold;
    }
  }
}

.privacy-footer {
  text-align: center;
  padding: 32rpx 0 48rpx;

  .footer-text {
    display: block;
    font-size: 26rpx;
    color: var(--text-color-secondary);
    margin-bottom: 8rpx;
    line-height: 1.6;
  }
}
</style>

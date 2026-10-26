<template>
  <view class="agreement-page">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="用户协议"
      :show-back="true"
      background-color="#ffffff"
      text-color="#333333"
    />

    <scroll-view class="content" scroll-y>
      <view class="agreement-content">
        <view class="agreement-title">闲七校园用户服务协议</view>

        <view class="agreement-section">
          <view class="section-title">一、总则</view>
          <view class="section-content">
            <text class="content-text">1.1 欢迎您使用闲七校园平台（以下简称"本平台"）！本协议是您与本平台之间就使用本平台服务所订立的协议。</text>
            <text class="content-text">1.2 本平台是指校园二手交易与共享平台，为高校学生提供交易和共享服务的应用程序。</text>
            <text class="content-text">1.3 您在使用本平台服务之前，应当认真阅读并遵守本协议。如您不同意本协议的任何内容，请立即停止使用本平台服务。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">二、账号注册与使用</view>
          <view class="section-content">
            <text class="content-text">2.1 您需要通过学号或手机号注册账号，注册时应提供真实、准确的个人信息。</text>
            <text class="content-text">2.2 您对您的账号和密码的安全负有全部责任，因保管不善可能导致账号被盗用，责任由您自行承担。</text>
            <text class="content-text">2.3 您不得将账号出租、出借、转让或以其他方式许可他人使用。</text>
            <text class="content-text">2.4 您应对使用您的账号所进行的一切活动负全部责任。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">三、用户行为规范</view>
          <view class="section-content">
            <text class="content-text">3.1 您在使用本平台服务时，必须遵守相关法律法规，不得利用本平台从事违法活动。</text>
            <text class="content-text">3.2 禁止发布以下信息：</text>
            <text class="content-text indent">（1）反对宪法所确定的基本原则的；</text>
            <text class="content-text indent">（2）危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的；</text>
            <text class="content-text indent">（3）损害国家荣誉和利益的；</text>
            <text class="content-text indent">（4）煽动民族仇恨、民族歧视，破坏民族团结的；</text>
            <text class="content-text indent">（5）破坏国家宗教政策，宣扬邪教和封建迷信的；</text>
            <text class="content-text indent">（6）散布谣言，扰乱社会秩序，破坏社会稳定的；</text>
            <text class="content-text indent">（7）散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；</text>
            <text class="content-text indent">（8）侮辱或者诽谤他人，侵害他人合法权益的；</text>
            <text class="content-text indent">（9）含有法律、行政法规禁止的其他内容的。</text>
            <text class="content-text">3.3 您不得进行以下行为：</text>
            <text class="content-text indent">（1）发布虚假信息、诈骗信息；</text>
            <text class="content-text indent">（2）发布违法商品或服务信息；</text>
            <text class="content-text indent">（3）恶意刷单、刷评价、虚假交易；</text>
            <text class="content-text indent">（4）干扰或破坏本平台的正常运行。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">四、交易规则</view>
          <view class="section-content">
            <text class="content-text">4.1 用户在本平台发布的商品信息应当真实、准确、完整。</text>
            <text class="content-text">4.2 禁止发布假冒伪劣商品、违禁品、盗版商品等。</text>
            <text class="content-text">4.3 交易双方应本着诚信原则进行交易，本平台不对交易纠纷承担法律责任。</text>
            <text class="content-text">4.4 共享物品的借用双方应妥善保管物品，如出现损坏或丢失，应按照约定承担相应责任。</text>
            <text class="content-text">4.5 用户评价应当真实客观，禁止恶意评价或虚假评价。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">五、信用评价</view>
          <view class="section-content">
            <text class="content-text">5.1 本平台实行信用评价制度，用户的信用积分将影响其在平台的权益。</text>
            <text class="content-text">5.2 用户可以通过良好的交易行为提升信用积分，违规行为将导致信用积分降低。</text>
            <text class="content-text">5.3 信用积分过低可能影响用户使用本平台的某些功能。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">六、隐私保护</view>
          <view class="section-content">
            <text class="content-text">6.1 本平台重视用户隐私保护，将采取合理措施保护用户的个人信息。</text>
            <text class="content-text">6.2 本平台收集的用户信息仅用于提供服务和改善用户体验。</text>
            <text class="content-text">6.3 未经用户同意，本平台不会向第三方披露用户个人信息，法律法规另有规定的除外。</text>
            <text class="content-text">6.4 用户可以查询、更正、删除自己的个人信息。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">七、知识产权</view>
          <view class="section-content">
            <text class="content-text">7.1 本平台的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等均受法律保护。</text>
            <text class="content-text">7.2 未经本平台书面许可，任何人不得擅自使用、复制、修改、传播上述内容。</text>
            <text class="content-text">7.3 用户发布的内容，其知识产权归用户所有，但用户授予本平台在全球范围内免费、非独家、可转授权的使用权利。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">八、免责声明</view>
          <view class="section-content">
            <text class="content-text">8.1 本平台不对用户发布的信息的真实性、准确性、完整性承担责任。</text>
            <text class="content-text">8.2 本平台不对交易双方的行为承担责任，交易纠纷由交易双方自行解决。</text>
            <text class="content-text">8.3 因不可抗力、网络故障、系统维护等原因导致服务中断或延迟，本平台不承担责任。</text>
            <text class="content-text">8.4 本平台有权根据业务发展需要修改本协议，修改后的协议将通过公告等方式告知用户。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">九、违约处理</view>
          <view class="section-content">
            <text class="content-text">9.1 如用户违反本协议，本平台有权采取警告、限制功能、暂停服务、终止账号等措施。</text>
            <text class="content-text">9.2 因用户违约给本平台或他人造成损失的，用户应承担相应的赔偿责任。</text>
            <text class="content-text">9.3 涉嫌违法犯罪的，本平台将向有关机关举报并配合调查。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">十、协议变更与终止</view>
          <view class="section-content">
            <text class="content-text">10.1 本平台有权根据需要修改本协议，修改后的协议一经公布即生效。</text>
            <text class="content-text">10.2 如您不同意修改后的协议，可以停止使用本平台服务并注销账号。</text>
            <text class="content-text">10.3 本协议终止后，用户仍需对其在使用本平台服务期间的行为承担责任。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">十一、法律适用与争议解决</view>
          <view class="section-content">
            <text class="content-text">11.1 本协议的订立、执行、解释及争议解决均适用中华人民共和国法律。</text>
            <text class="content-text">11.2 如发生争议，双方应友好协商解决；协商不成的，任何一方均可向本平台所在地人民法院提起诉讼。</text>
          </view>
        </view>

        <view class="agreement-section">
          <view class="section-title">十二、联系我们</view>
          <view class="section-content">
            <text class="content-text">如您对本协议有任何疑问，或需要向我们反馈问题，请通过以下方式联系我们：</text>
            <text class="content-text">邮箱：support@xianqi.com</text>
            <text class="content-text">客服电话：400-xxx-xxxx</text>
          </view>
        </view>

        <view class="agreement-footer">
          <text class="footer-text">本协议最后更新日期：2024年1月1日</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style lang="scss" scoped>
.agreement-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  height: 100vh;
}

.agreement-content {
  padding: 32rpx 24rpx;
}

.agreement-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary);
  text-align: center;
  margin-bottom: 48rpx;
  line-height: 1.4;
}

.agreement-section {
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
  gap: 16rpx;
}

.content-text {
  font-size: 28rpx;
  color: var(--text-color-secondary);
  line-height: 1.8;
  word-break: break-all;

  &.indent {
    padding-left: 40rpx;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 16rpx;
      top: 12rpx;
      width: 8rpx;
      height: 8rpx;
      background: var(--primary-color);
      border-radius: 50%;
    }
  }
}

.agreement-footer {
  text-align: center;
  padding: 48rpx 0 32rpx;
}

.footer-text {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}
</style>

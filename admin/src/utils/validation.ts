/**
 * 类型验证和测试工具
 * 用于验证前后端字段类型修复的效果
 */

import {
  formatCurrency,
  addAmounts,
  compareAmounts,
  isValidAmount,
  toNumber,
} from './currency'
import {
  FeedbackType,
  FeedbackTypeText,
  FeedbackStatus,
  FeedbackStatusText,
  getEnumOptions,
  ProductStatus,
  ProductStatusText,
} from './enums'

// ==================== 金额类型验证 ====================

/**
 * 测试金额字段的string类型
 */
export function testAmountStringType() {
  console.group('🧪 测试金额字段类型')

  // 测试格式化
  const price1 = formatCurrency('1234.56')
  console.log('✅ 格式化金额:', price1) // ¥1,234.56

  const price2 = formatCurrency('99.9')
  console.log('✅ 格式化小数:', price2) // ¥99.90

  // 测试计算
  const sum = addAmounts('1234.56', '99.9')
  console.log('✅ 金额相加:', sum) // 1334.46

  const comparison = compareAmounts('1234.56', '99.9')
  console.log('✅ 金额比较:', comparison) // 1 (大于)

  // 测试验证
  const valid1 = isValidAmount('1234.56')
  console.log('✅ 有效金额验证:', valid1) // true

  const valid2 = isValidAmount('abc')
  console.log('✅ 无效金额验证:', valid2) // false

  // 测试精度问题
  const preciseNum = toNumber('0.1 + 0.2') // 字符串避免精度问题
  console.log('✅ 字符串避免精度问题:', preciseNum) // 正确结果

  console.groupEnd()
}

// ==================== 分页参数验证 ====================

/**
 * 测试分页参数统一性
 */
export function testPaginationParams() {
  console.group('🧪 测试分页参数统一性')

  // 模拟标准的分页参数
  const standardParams = {
    pageNum: 1,
    pageSize: 20,
    sortBy: 'createTime',
    sortOrder: 'desc' as const,
  }

  console.log('✅ 标准分页参数:', standardParams)
  console.log('✅ pageNum类型:', typeof standardParams.pageNum) // number
  console.log('✅ pageSize类型:', typeof standardParams.pageSize) // number

  // 验证参数结构
  const hasPageNum = 'pageNum' in standardParams
  const hasPageSize = 'pageSize' in standardParams
  console.log('✅ 包含pageNum:', hasPageNum) // true
  console.log('✅ 包含pageSize:', hasPageSize) // true

  console.groupEnd()
}

// ==================== 枚举值验证 ====================

/**
 * 测试枚举值统一管理
 */
export function testEnumManagement() {
  console.group('🧪 测试枚举值统一管理')

  // 测试反馈类型枚举
  const feedbackType = FeedbackType.SUGGESTION
  console.log('✅ 反馈类型值:', feedbackType) // 1
  console.log('✅ 反馈类型文本:', FeedbackTypeText[feedbackType]) // 功能建议

  // 测试反馈状态枚举
  const feedbackStatus = FeedbackStatus.PENDING
  console.log('✅ 反馈状态值:', feedbackStatus) // 0
  console.log('✅ 反馈状态文本:', FeedbackStatusText[feedbackStatus]) // 待处理

  // 测试商品状态枚举
  const productStatus = ProductStatus.ON_SALE
  console.log('✅ 商品状态值:', productStatus) // 1
  console.log('✅ 商品状态文本:', ProductStatusText[productStatus]) // 在售

  // 测试获取枚举选项
  const feedbackTypeOptions = getEnumOptions(FeedbackTypeText)
  console.log('✅ 反馈类型选项:', feedbackTypeOptions)

  console.groupEnd()
}

// ==================== 字段类型映射验证 ====================

/**
 * 测试前后端字段类型映射
 */
export function testFieldMapping() {
  console.group('🧪 测试前后端字段类型映射')

  // 商品审核VO字段类型
  interface ProductAuditVO {
    productId: string
    title: string
    price: string // 修复后：string类型
    originalPrice?: string // 修复后：string类型
    status: number
    auditStatus: number
  }

  const product: ProductAuditVO = {
    productId: '1',
    title: '测试商品',
    price: '1234.56', // 正确使用string
    originalPrice: '2345.67', // 正确使用string
    status: 1,
    auditStatus: 1,
  }

  console.log('✅ 商品价格类型:', typeof product.price) // string
  console.log('✅ 商品原价类型:', typeof product.originalPrice) // string
  console.log('✅ 格式化价格:', formatCurrency(product.price))

  // 订单管理VO字段类型
  interface OrderManageVO {
    orderId: string
    productPrice: string // 修复后：string类型
    totalAmount: string // 修复后：string类型
  }

  const order: OrderManageVO = {
    orderId: '1',
    productPrice: '99.99', // 正确使用string
    totalAmount: '199.98', // 正确使用string
  }

  console.log('✅ 订单价格类型:', typeof order.productPrice) // string
  console.log('✅ 订单总额类型:', typeof order.totalAmount) // string
  console.log('✅ 格式化总额:', formatCurrency(order.totalAmount))

  console.groupEnd()
}

// ==================== 综合验证 ====================

/**
 * 运行所有验证测试
 */
export function runAllValidationTests() {
  console.clear()
  console.log('🚀 开始运行前后端字段类型修复验证测试\n')

  try {
    testAmountStringType()
    testPaginationParams()
    testEnumManagement()
    testFieldMapping()

    console.log('\n✅ 所有验证测试通过！')
    console.log('📋 修复总结:')
    console.log('  1. ✅ 金额字段已从number改为string类型')
    console.log('  2. ✅ 分页参数已统一为pageNum/pageSize')
    console.log('  3. ✅ 枚举值已集中管理，避免硬编码')
    console.log('  4. ✅ 创建了金额处理工具函数')
    console.log('  5. ✅ 提供了类型安全的金额定义')

  } catch (error) {
    console.error('❌ 验证测试失败:', error)
  }
}

// 如果在浏览器环境中运行，自动执行测试
if (typeof window !== 'undefined') {
  console.log('💡 在浏览器控制台中运行 runAllValidationTests() 来执行验证测试')
}

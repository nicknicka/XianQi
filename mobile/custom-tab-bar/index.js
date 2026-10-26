Component({
  data: {
    selected: 0,
    activeColor: '#8EC5E8',
    inactiveColor: '#999999',
    backgroundColor: '#ffffff',
    tabBarStyle: '',
    tabItems: [
      { text: '首页', pagePath: '/pages/index/index', iconClass: 'icon-shouye', badge: 0 },
      { text: '交易', pagePath: '/pages/market/list', iconClass: 'icon-jiaoyi', badge: 0 },
      { text: '发布', pagePath: '/pages/publish/index', iconClass: 'icon-fabu', badge: 0 },
      { text: '消息', pagePath: '/pages/message/index', iconClass: 'icon-message', badge: 0 },
      { text: '我的', pagePath: '/pages/mine/index', iconClass: 'icon-wode', badge: 0 }
    ]
  },
  lifetimes: {
    attached() {
      this.syncFromStorage()
      this.syncSelectedByRoute()
    }
  },
  pageLifetimes: {
    show() {
      this.syncFromStorage()
      this.syncSelectedByRoute()
    }
  },
  methods: {
    normalizeRoute(route) {
      if (!route) {
        return ''
      }

      return String(route).split('?')[0].replace(/^\//, '')
    },
    syncFromStorage() {
      try {
        const raw = wx.getStorageSync('theme_css_vars')
        const vars = raw ? JSON.parse(raw) : {}
        const activeColor = vars['--tab-bar-selected-color'] || vars['--primary-color'] || '#8EC5E8'
        const inactiveColor = vars['--tab-bar-color'] || vars['--text-color-tertiary'] || '#999999'
        const backgroundColor = vars['--tab-bar-background'] || vars['--bg-color-card'] || '#ffffff'

        this.setData({
          activeColor,
          inactiveColor,
          backgroundColor,
          tabBarStyle: `background: ${backgroundColor}; border-top-color: rgba(0, 0, 0, 0.08);`
        })
      } catch (error) {
        this.setData({
          activeColor: '#8EC5E8',
          inactiveColor: '#999999',
          backgroundColor: '#ffffff',
          tabBarStyle: 'background: #ffffff; border-top-color: rgba(0, 0, 0, 0.08);'
        })
      }
    },
    syncSelectedByRoute() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const currentPath = this.normalizeRoute(currentPage && currentPage.route)
      const index = this.data.tabItems.findIndex(item => this.normalizeRoute(item.pagePath) === currentPath)
      if (index !== -1) {
        this.setData({ selected: index })
      }
    },
    onItemTap(event) {
      const index = Number(event.currentTarget.dataset.index)
      const item = this.data.tabItems[index]
      if (!item) return
      if (index === this.data.selected) return

      this.setData({ selected: index })
      wx.switchTab({ url: item.pagePath })
    }
  }
})

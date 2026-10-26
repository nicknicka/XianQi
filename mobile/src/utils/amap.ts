/**
 * 高德地图工具类
 * 用于地图相关功能：地理编码、逆地理编码、地点搜索等
 */

interface LocationInfo {
  longitude: number
  latitude: number
  name?: string
  address?: string
  province?: string
  city?: string
  district?: string
}

interface SearchParams {
  keywords: string
  city?: string
  pageSize?: number
  pageIndex?: number
}

interface SearchResult {
  name: string
  address: string
  longitude: number
  latitude: number
  province?: string
  city?: string
  district?: string
}

class AmapUtil {
  // Web端 Key (H5使用)
  private webKey = import.meta.env.VITE_AMAP_WEB_KEY || ''

  // 微信小程序 Key
  private miniprogramKey = import.meta.env.VITE_AMAP_MINIPROGRAM_KEY || ''

  // 安全密钥
  private secretKey = import.meta.env.VITE_AMAP_SECRET_KEY || ''

  /**
   * 获取当前平台对应的 Key
   */
  private getKey(): string {
    // #ifdef H5
    return this.webKey
    // #endif

    // #ifdef MP-WEIXIN
    return this.miniprogramKey
    // #endif

    // #ifdef APP-PLUS
    return this.webKey // App 端也使用 Web Key
    // #endif

    return this.webKey
  }

  /**
   * 逆地理编码：坐标转地址
   * @param longitude 经度
   * @param latitude 纬度
   */
  async reverseGeocode(longitude: number, latitude: number): Promise<LocationInfo | null> {
    try {
      // 使用高德地图逆地理编码 API
      const key = this.getKey()
      const url = `/geocode/regeo?key=${key}&location=${longitude},${latitude}&extensions=base`

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1') {
        const regeocode = res.data.regeocode
        const addressComponent = regeocode.addressComponent

        return {
          longitude,
          latitude,
          name: regeocode.formatted_address || '选中位置',
          address: this.formatAddress(addressComponent),
          province: addressComponent.province,
          city: addressComponent.city,
          district: addressComponent.district
        }
      }

      return null
    } catch (error) {
      console.error('逆地理编码失败:', error)
      return null
    }
  }

  /**
   * 地理编码：地址转坐标
   * @param address 地址
   * @param city 城市（可选）
   */
  async geocode(address: string, city?: string): Promise<LocationInfo | null> {
    try {
      const key = this.getKey()
      let url = `/geocode/geo?key=${key}&address=${encodeURIComponent(address)}`

      if (city) {
        url += `&city=${encodeURIComponent(city)}`
      }

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1' && res.data.geocodes.length > 0) {
        const geocode = res.data.geocodes[0]
        const location = geocode.location.split(',')

        return {
          longitude: parseFloat(location[0]),
          latitude: parseFloat(location[1]),
          name: geocode.formatted_address,
          address: geocode.formatted_address
        }
      }

      return null
    } catch (error) {
      console.error('地理编码失败:', error)
      return null
    }
  }

  /**
   * 地点搜索（关键字搜索）
   * @param params 搜索参数
   */
  async searchPlace(params: SearchParams): Promise<SearchResult[]> {
    try {
      const key = this.getKey()
      let url = `/place/text?key=${key}&keywords=${encodeURIComponent(params.keywords)}`

      if (params.city) {
        url += `&city=${encodeURIComponent(params.city)}`
      }

      url += `&pageSize=${params.pageSize || 20}`
      url += `&pageIndex=${params.pageIndex || 1}`

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1' && res.data.pois) {
        return res.data.pois.map((poi: any) => {
          const location = poi.location.split(',')
          return {
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            longitude: parseFloat(location[0]),
            latitude: parseFloat(location[1]),
            province: poi.pname,
            city: poi.cityname,
            district: poi.adname
          }
        })
      }

      return []
    } catch (error) {
      console.error('地点搜索失败:', error)
      return []
    }
  }

  /**
   * 周边搜索
   * @param keyword 关键词
   * @param longitude 经度
   * @param latitude 纬度
   * @param radius 半径（米），默认1000米
   */
  async searchAround(
    keyword: string,
    longitude: number,
    latitude: number,
    radius = 1000
  ): Promise<SearchResult[]> {
    try {
      const key = this.getKey()
      const url = `/place/around?key=${key}&keywords=${encodeURIComponent(keyword)}&location=${longitude},${latitude}&radius=${radius}`

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1' && res.data.pois) {
        return res.data.pois.map((poi: any) => {
          const location = poi.location.split(',')
          return {
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            longitude: parseFloat(location[0]),
            latitude: parseFloat(location[1]),
            province: poi.pname,
            city: poi.cityname,
            district: poi.adname
          }
        })
      }

      return []
    } catch (error) {
      console.error('周边搜索失败:', error)
      return []
    }
  }

  /**
   * 获取距离（直线距离）
   * @param origins 起点坐标 "经度,纬度|经度,纬度"
   * @param destination 终点坐标 "经度,纬度"
   */
  async getDistance(origins: string, destination: string): Promise<number | null> {
    try {
      const key = this.getKey()
      const url = `/distance?key=${key}&origins=${origins}&destination=${destination}&type=1`

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1' && res.data.results.length > 0) {
        // 返回距离（米）
        return res.data.results[0].distance
      }

      return null
    } catch (error) {
      console.error('获取距离失败:', error)
      return null
    }
  }

  /**
   * 路径规划（驾车）
   * @param origin 起点坐标 "经度,纬度"
   * @param destination 终点坐标 "经度,纬度"
   */
  async getDrivingRoute(origin: string, destination: string): Promise<any | null> {
    try {
      const key = this.getKey()
      const url = `/direction/driving?key=${key}&origin=${origin}&destination=${destination}&extensions=base`

      const res = await uni.request({
        url: 'https://restapi.amap.com/v3' + url,
        method: 'GET'
      }) as any

      if (res.data && res.data.status === '1' && res.data.route) {
        return res.data.route
      }

      return null
    } catch (error) {
      console.error('路径规划失败:', error)
      return null
    }
  }

  /**
   * 格式化地址
   */
  private formatAddress(component: any): string {
    const parts = []

    if (component.province && component.province !== component.city) {
      parts.push(component.province)
    }

    if (component.city && component.city !== component.district) {
      parts.push(component.city)
    }

    if (component.district) {
      parts.push(component.district)
    }

    if (component.township) {
      parts.push(component.township)
    }

    return parts.join('')
  }

  /**
   * 计算两个坐标点之间的距离（Haversine公式）
   * @param lng1 经度1
   * @param lat1 纬度1
   * @param lng2 经度2
   * @param lat2 纬度2
   * @returns 距离（米）
   */
  calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
    const R = 6371000 // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * 度数转弧度
   */
  private toRad(deg: number): number {
    return deg * Math.PI / 180
  }
}

// 导出单例
export default new AmapUtil()

// 导出类型
export type { LocationInfo, SearchParams, SearchResult }

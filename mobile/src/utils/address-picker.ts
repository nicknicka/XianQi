/**
 * 地址选择工具类
 * 提供省市区三级联动数据和选择功能
 */

// 省份数据类型
export interface Province {
  code: string
  name: string
  children?: City[]
}

// 城市数据类型
export interface City {
  code: string
  name: string
  children?: District[]
}

// 区县数据类型
export interface District {
  code: string
  name: string
}

// 选中的地址
export interface SelectedAddress {
  provinceCode?: string
  provinceName?: string
  cityCode?: string
  cityName?: string
  districtCode?: string
  districtName?: string
  fullAddress?: string
}

// 简化的省市区数据（示例数据，实际项目应该使用完整的）
export const DEFAULT_REGION_DATA: Province[] = [
  {
    code: '110000',
    name: '北京市',
    children: [
      { code: '110100', name: '市辖区', children: [
        { code: '110101', name: '东城区' },
        { code: '110102', name: '西城区' },
        { code: '110105', name: '朝阳区' },
        { code: '110106', name: '丰台区' },
        { code: '110107', name: '石景山区' },
        { code: '110108', name: '海淀区' },
        { code: '110109', name: '门头沟区' },
        { code: '110111', name: '房山区' },
        { code: '110112', name: '通州区' },
        { code: '110113', name: '顺义区' },
        { code: '110114', name: '昌平区' },
        { code: '110115', name: '大兴区' },
        { code: '110116', name: '怀柔区' },
        { code: '110117', name: '平谷区' },
        { code: '110118', name: '密云区' },
        { code: '110119', name: '延庆区' }
      ]}
    ]
  },
  {
    code: '310000',
    name: '上海市',
    children: [
      { code: '310100', name: '市辖区', children: [
        { code: '310101', name: '黄浦区' },
        { code: '310104', name: '徐汇区' },
        { code: '310105', name: '长宁区' },
        { code: '310106', name: '静安区' },
        { code: '310107', name: '普陀区' },
        { code: '310109', name: '虹口区' },
        { code: '310110', name: '杨浦区' },
        { code: '310112', name: '闵行区' },
        { code: '310113', name: '宝山区' },
        { code: '310114', name: '嘉定区' },
        { code: '310115', name: '浦东新区' },
        { code: '310116', name: '金山区' },
        { code: '310117', name: '松江区' },
        { code: '310118', name: '青浦区' },
        { code: '310120', name: '奉贤区' },
        { code: '310151', name: '崇明区' }
      ]}
    ]
  },
  {
    code: '440000',
    name: '广东省',
    children: [
      { code: '440100', name: '广州市', children: [
        { code: '440103', name: '荔湾区' },
        { code: '440104', name: '越秀区' },
        { code: '440105', name: '海珠区' },
        { code: '440106', name: '天河区' },
        { code: '440111', name: '白云区' },
        { code: '440112', name: '黄埔区' },
        { code: '440113', name: '番禺区' },
        { code: '440114', name: '花都区' },
        { code: '440115', name: '南沙区' },
        { code: '440117', name: '从化区' },
        { code: '440118', name: '增城区' }
      ]},
      { code: '440300', name: '深圳市', children: [
        { code: '440303', name: '罗湖区' },
        { code: '440304', name: '福田区' },
        { code: '440305', name: '南山区' },
        { code: '440306', name: '宝安区' },
        { code: '440307', name: '龙岗区' },
        { code: '440308', name: '盐田区' },
        { code: '440309', name: '龙华区' },
        { code: '440310', name: '坪山区' },
        { code: '440311', name: '光明区' }
      ]},
      { code: '440400', name: '珠海市', children: [
        { code: '440402', name: '香洲区' },
        { code: '440403', name: '斗门区' },
        { code: '440404', name: '金湾区' }
      ]},
      { code: '440600', name: '佛山市', children: [
        { code: '440604', name: '禅城区' },
        { code: '440605', name: '南海区' },
        { code: '440606', name: '顺德区' },
        { code: '440607', name: '三水区' },
        { code: '440608', name: '高明区' }
      ]},
      { code: '441900', name: '东莞市', children: [] },
      { code: '442000', name: '中山市', children: [] }
    ]
  },
  {
    code: '330000',
    name: '浙江省',
    children: [
      { code: '330100', name: '杭州市', children: [
        { code: '330102', name: '上城区' },
        { code: '330105', name: '拱墅区' },
        { code: '330106', name: '西湖区' },
        { code: '330108', name: '滨江区' },
        { code: '330109', name: '萧山区' },
        { code: '330110', name: '余杭区' },
        { code: '330111', name: '富阳区' },
        { code: '330112', name: '临安区' },
        { code: '330122', name: '桐庐县' },
        { code: '330127', name: '淳安县' },
        { code: '330182', name: '建德市' }
      ]},
      { code: '330200', name: '宁波市', children: [
        { code: '330203', name: '海曙区' },
        { code: '330205', name: '江北区' },
        { code: '330206', name: '北仑区' },
        { code: '330211', name: '镇海区' },
        { code: '330212', name: '鄞州区' },
        { code: '330213', name: '奉化区' },
        { code: '330225', name: '象山县' },
        { code: '330226', name: '宁海县' },
        { code: '330281', name: '余姚市' },
        { code: '330282', name: '慈溪市' }
      ]},
      { code: '330300', name: '温州市', children: [
        { code: '330302', name: '鹿城区' },
        { code: '330303', name: '龙湾区' },
        { code: '330304', name: '瓯海区' },
        { code: '330305', name: '洞头区' },
        { code: '330324', name: '永嘉县' },
        { code: '330326', name: '平阳县' },
        { code: '330327', name: '苍南县' },
        { code: '330328', name: '文成县' },
        { code: '330329', name: '泰顺县' },
        { code: '330381', name: '瑞安市' },
        { code: '330382', name: '乐清市' }
      ]}
    ]
  },
  {
    code: '320000',
    name: '江苏省',
    children: [
      { code: '320100', name: '南京市', children: [
        { code: '320102', name: '玄武区' },
        { code: '320104', name: '秦淮区' },
        { code: '320105', name: '建邺区' },
        { code: '320106', name: '鼓楼区' },
        { code: '320111', name: '浦口区' },
        { code: '320113', name: '栖霞区' },
        { code: '320114', name: '雨花台区' },
        { code: '320115', name: '江宁区' },
        { code: '320116', name: '六合区' },
        { code: '320117', name: '溧水区' },
        { code: '320118', name: '高淳区' }
      ]},
      { code: '320200', name: '无锡市', children: [
        { code: '320205', name: '锡山区' },
        { code: '320206', name: '惠山区' },
        { code: '320211', name: '滨湖区' },
        { code: '320213', name: '梁溪区' },
        { code: '320214', name: '新吴区' },
        { code: '320281', name: '江阴市' },
        { code: '320282', name: '宜兴市' }
      ]},
      { code: '320500', name: '苏州市', children: [
        { code: '320505', name: '虎丘区' },
        { code: '320506', name: '吴中区' },
        { code: '320507', name: '相城区' },
        { code: '320508', name: '姑苏区' },
        { code: '320509', name: '吴江区' },
        { code: '320581', name: '常熟市' },
        { code: '320582', name: '张家港市' },
        { code: '320583', name: '昆山市' },
        { code: '320585', name: '太仓市' }
      ]}
    ]
  }
]

/**
 * 地址选择类
 */
export class AddressPicker {
  private data: Province[]

  constructor(data: Province[] = DEFAULT_REGION_DATA) {
    this.data = data
  }

  /**
   * 获取所有省份
   */
  getProvinces(): Province[] {
    return this.data
  }

  /**
   * 根据省份代码获取城市列表
   */
  getCities(provinceCode: string): City[] {
    const province = this.data.find(p => p.code === provinceCode)
    return province?.children || []
  }

  /**
   * 根据城市代码获取区县列表
   */
  getDistricts(cityCode: string): District[] {
    for (const province of this.data) {
      if (province.children) {
        for (const city of province.children) {
          if (city.code === cityCode) {
            return city.children || []
          }
        }
      }
    }
    return []
  }

  /**
   * 根据代码获取完整地址
   */
  getAddressByCode(code: string): string {
    const province = this.data.find(p => p.code === code.substring(0, 6))
    if (!province) return ''

    const cities = province.children || []
    const city = cities.find(c => c.code === code.substring(0, 6))
    if (!city) return province.name

    const districts = city.children || []
    const district = districts.find(d => d.code === code.substring(0, 6))
    if (!district) return `${province.name}${city.name}`

    return `${province.name}${city.name}${district.name}`
  }

  /**
   * 根据名称获取代码
   */
  getCodeByName(provinceName: string, cityName?: string, districtName?: string): string | null {
    const province = this.data.find(p => p.name === provinceName)
    if (!province) return null

    if (!cityName) return province.code

    const cities = province.children || []
    const city = cities.find(c => c.name === cityName)
    if (!city) return null

    if (!districtName) return city.code

    const districts = city.children || []
    const district = districts.find(d => d.name === districtName)
    if (!district) return null

    return district.code
  }

  /**
   * 解析地址字符串
   */
  parseAddress(address: string): SelectedAddress | null {
    // 移除所有空格
    address = address.replace(/\s+/g, '')

    // 尝试匹配省市区
    for (const province of this.data) {
      if (!address.startsWith(province.name)) continue

      const remainAfterProvince = address.substring(province.name.length)
      const cities = province.children || []

      for (const city of cities) {
        if (!remainAfterProvince.startsWith(city.name)) continue

        const remainAfterCity = remainAfterProvince.substring(city.name.length)
        const districts = city.children || []

        // 尝试匹配区县
        for (const district of districts) {
          if (remainAfterCity.startsWith(district.name)) {
            return {
              provinceCode: province.code,
              provinceName: province.name,
              cityCode: city.code,
              cityName: city.name,
              districtCode: district.code,
              districtName: district.name,
              fullAddress: address
            }
          }
        }

        // 没有匹配到区县，只有省市
        return {
          provinceCode: province.code,
          provinceName: province.name,
          cityCode: city.code,
          cityName: city.name,
          fullAddress: address
        }
      }

      // 只匹配到省
      return {
        provinceCode: province.code,
        provinceName: province.name,
        fullAddress: address
      }
    }

    return null
  }
}

// 创建默认实例
export const addressPicker = new AddressPicker()

export default {
  AddressPicker,
  addressPicker,
  DEFAULT_REGION_DATA
}

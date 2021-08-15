export interface ProductResponse {
  carouselImages: Thumb[]
  categories: Category[]
  code: string
  color: Color
  colorSizeOptions: ColorSizeOption[]
  custom: boolean
  description: string
  editorialComponents: any[]
  freeTextLabel: string
  hasSizeGuide: boolean
  isHenderScheme: boolean
  isHoganByYou: boolean
  isOnlineExclusive: boolean
  name: string
  picture: Picture
  salableStores: boolean
  sizeType: string
  stock: Stock
  summary: string
  thumb: Thumb
  url: string
  variantOptions: VariantOption[]
}

interface Thumb {
  altText: string
  url: string
}

interface Category {
  code: string
  url: string
}

enum Color {
  Beige = 'BEIGE',
}

interface ColorSizeOption {
  color: string
  image: string
  skuOrigin: string
}

interface Picture {
  url: string
}

interface Stock {
  stockLevel: number
  stockLevelAvailable: number
  stockLevelStatus: StockLevelStatus
}

enum StockLevelStatus {
  Outofstock = 'OUTOFSTOCK',
}

interface VariantOption {
  code: string
  color: Color
  isDiscount: boolean
  messagePreorder: string
  messageStock: MessageStock
  messageWarehouseTods: string
  preorder: number
  size: string
  sizeCode: string
  stock: Stock
  stockLevel: number
  url: string
  warehouseTods: number
}

enum MessageStock {
  FindInStore = 'Find in store',
}

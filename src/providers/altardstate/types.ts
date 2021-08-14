export type TProviderData = {
  action: string
  queryString: string
  locale: string
  product: {
    uuid: string
    id: string
    productName: string
    productType: string
    brand: string
    price: {
      sales: {
        value: number
        currency: string
        formatted: string
        decimalPrice: string
      }
      list: {
        value: number
        currency: string
        formatted: string
        decimalPrice: string
      }
      html: string
    }
    selectedQuantity: number
    minOrderQuantity: number
    maxOrderQuantity: number
    isOnSale: boolean
    variationAttributes: {
      attributeId: string
      displayName: string
      id: string
      swatchable: boolean
      values: TVariationAttributes[]
    }[]
    longDescription: string
    shortDescription: string
    rating: number
    promotions: {
      calloutMsg: string
      details: string
      enabled: boolean
      id: string
      name: string
      promotionClass: string
      rank: null
    }[]
    attributes: null
    availability: {
      messages: string[]
      inStockDate: null
    }
    available: boolean
    options: any[]
    quantities: any[]
    sizeChartId: null
    selectedProductUrl: string
    online: boolean
    pageTitle: null
    pageDescription: null
    pageKeywords: null
    pageMetaTags: any[]
    template: null
    linkedASProductId: null
    linkedArulaProductId: null
    socialSharingFacebook: string
    socialSharingTwitter: string
    socialSharingPinterest: string
    pdpInterruptor: string
    variationGroupAttributes: {
      attributeId: string
      displayName: string
      id: string
      priceColorGroup: TVariationAttributes[]
    }[]
    images: {
      [key in 'zoom' | 'large' | 'small' | 'medium']: {
        alt: string
        url: string
        title: string
      }[]
    }
    readyToOrder: boolean
    videostorage: null
    fit: string
    closure: string
    material: string
    otherDetails: string
    sleeveLength: string
    countryOfOrigin: string
    measurements: string
    washInstructions: string
    packQuantity: null
    productEditorialHeadline: string
    primaryProductCategory: {
      ID: string
      displayName: string
    }
    updatedPID: string
    masterPID: string
    sale: boolean
    productCategory: string
    availableForInStorePickup: boolean
    attributesHtml: string
  }
  resources: {
    info_selectforstock: string
  }
  message: string
  variantGTMJson: {
    name: string
    id: string
    product_style_id: string
    price: number
    brand: string
    category: string
    list: string
    position: null
    dimension4: string
    dimension5: string
    variant_id: string
    category_1: string
    category_2: string
    category_3: string
    stock_level: number
    discount_value: number
    discount_percentage: number
    original_price: number
    original_price_local_currency: number
    categories_ids: string[]
    category_id: string
  }[]
}

export interface TVariationAttributes {
  id?: string
  description?: null | string
  displayValue?: string
  value?: string
  selected?: boolean
  selectable?: boolean
  url?: string
  images?: {
    swatch: {
      alt: string
      url: string
      title: string
    }[]
  }
  price?: string
  colors?: TVariationAttributes[]
  swatchable?: boolean
}

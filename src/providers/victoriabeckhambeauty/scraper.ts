import { TShopifyExtraData } from '../shopify/scraper'

export interface IVictoriaBeckhamBeautyCustomProduct {
  hash: string
  data: {
    product: {
      id: string
      title: string
      descriptionHtml: string
      vendor: string
      path: string
      handle: string
      legacyId: {
        USD: string
      }
      contentful: {
        title: string
        description: string
        ingredientTechnology: string
        howTo: {
          title: string
          text: string
          videoWithPoster: {
            video: {
              src: string
            }
            poster: {
              src: string
            }
          }
        }
        images: []
        enableVirtualTryOn: null
        collection: {
          handle: string
          seoTitle: string
        }
      }
      variants: IVictoriaBeckhamBeautyCustomVariant[]
      images: {
        id: string
        src: string
      }[]
    }
    contentfulData: any // IGNORE
  }
  context: {}
}

export interface IVictoriaBeckhamBeautyCustomVariant {
  id: string
  sku: string
  title: string
  currentlyNotInStock: false
  availableForSale: true
  quantityAvailable: 9121
  price: {
    USD: number
    EUR: number
    GBP: number
    AUD: number
    CAD: number
  }
  compareAtPrice: {
    USD: number | null
    EUR: number | null
    GBP: number | null
    AUD: number | null
    CAD: number | null
  }
  shopifyId: {
    USD: string
    EUR: string
    GBP: string
    AUD: string
    CAD: string
  }
  legacyId: {
    USD: string
  }
  selectedOptions: { name: string; value: string }[]
  product: {
    title: string
    handle: string
    productType: string
    images: { id: string; src: string }[]
    contentful: {
      collection: {
        seoTitle: string
      }
    }
    legacyId: {
      USD: string
    }
  }
  contentful: {
    specialLabel: string
    preOrderShippingDate: null
    backOrderShippingDate: null
    swatch: {
      src: string
      alt: string
    }
    hero: null
    ingredientsCopy: string
    images: {
      type: string
      src: string
      alt: string
      dimensions: {
        width: number
        height: number
      }
    }[]
    description: string
    subtitle: string
  }
  image: {
    id: string
    src: string
  }
}

export interface IVictoriaBeckhamBeautyAggregatedCustomVariant
  extends IVictoriaBeckhamBeautyCustomVariant {
  url: string
}

export type TVictoriaBeckhamBeautyExtraData = TShopifyExtraData & {
  variants?: Record<string, IVictoriaBeckhamBeautyAggregatedCustomVariant>
}

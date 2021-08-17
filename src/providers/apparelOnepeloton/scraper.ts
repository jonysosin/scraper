import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.modal__content')

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,

      _extraData: TShopifyExtraData,
    ) => {
  
      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.trim().replace(/\s*\([\w\d]+\)$/, '')
    },
  },
  {},
)

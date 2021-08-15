import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.product-form--modal')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * ["Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

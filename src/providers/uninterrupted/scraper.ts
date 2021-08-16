import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get the sizechart (if any)
       */
      extraData.sizeChartHtml = await page.evaluate(getSelectorOuterHtml => {
        const hasSizeChart = document.querySelector('.product-form--variants a.modal--link')

        if (hasSizeChart) {
          return document.querySelector('.product-form--modal')?.outerHTML?.trim()
        } else return ''
      })

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

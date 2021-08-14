import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent.replace(/\n/gim, '').split('›')
          : []
      })

      /**
       * Get Size Chart HTML
       */

      const sizeChartSelector = await page.evaluate(() => {
        const sizeGuideButton = document.querySelector('.size-guide-btn')
        if (sizeGuideButton) {
          return '.sizeguide'
        }
        return null
      })
      if (sizeChartSelector) {
        extraData.sizeChartHtml = await getSelectorOuterHtml(page, sizeChartSelector)
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Size", "DESIGN", "Gift Card", "Color", "COLOR"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.COLOR) {
        product.color = optionsObj.Color || optionsObj.COLOR
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

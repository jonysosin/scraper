// import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
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
        const breadcrumbsSelector = document.querySelectorAll('ul.breadcrumb li')
        const breadcrumbs = Array.from(breadcrumbsSelector)?.map(e => e.textContent?.trim() || '')

        return breadcrumbs || []
      })

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.size-chart--link')

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Size", "Title", "Sleeve Length", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get the sizeChartUrl
       */
      const sizeChartUrl = await page.evaluate(() => {
        return document.querySelector('.size-chart--link')?.getAttribute('href')
      })
      if (sizeChartUrl) {
        product.sizeChartUrls = [sizeChartUrl]
      }
    },
  },
  {},
)

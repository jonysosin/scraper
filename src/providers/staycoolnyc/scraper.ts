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
        const breadcrumbs =
          document
            .querySelector('.breadcrumb_text')
            ?.textContent?.split('/')
            .map(e => e?.trim()) || []
        breadcrumbs.shift() // Remove first element because it's corrupted (it says "Home\n   \n    \s   Shop" and should display only "Shop")
        breadcrumbs.unshift('Shop')
        return breadcrumbs
      })

      /**
       * Get Size Chart HTML
       */
      await page.waitForSelector('.main-chart-table')
      const sizeChart = await page.evaluate(() => {
        return document.querySelector('.main-chart-table')?.outerHTML.trim()
      })
      if (sizeChart) {
        extraData.sizeChartHtml = sizeChart
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (2) ["Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

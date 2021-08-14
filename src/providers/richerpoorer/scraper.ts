import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('/')
              .map(e => e.trim())
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const key = document.querySelector('.product-info__care h2')?.textContent?.trim()
        const value = document.querySelector('.product-info__care :not(h2)')?.outerHTML.trim()
        // Add missing description
        return [
          {
            name: key || '',
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of sizeChartUrls
       */

      const sizeChartUrls = await page.evaluate(() => {
        const sizeGuideFits = document.querySelector('.size-guide-fits')?.outerHTML?.trim() || ''

        const sizeChartUrls = Array.from(document.querySelectorAll('.tabs__tab table')).map(
          e => e.outerHTML.trim() || '',
        )

        sizeChartUrls.push(sizeGuideFits)

        return sizeChartUrls
      })

      product.sizeChartUrls = sizeChartUrls ? sizeChartUrls : []

      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

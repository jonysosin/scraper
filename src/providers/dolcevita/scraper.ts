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
        return Array.from(document.querySelectorAll('.product-breadcrumb li')).map(
          e => e.textContent?.trim().replace(/\/$/, '') || '',
        )
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-description-wrapper > ul > li'),
        ).map(e => e.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-description-wrapper > div'),
        ).map(e => e.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await page.evaluate(() => {
        const element = document.querySelector('.size_table ')?.parentElement?.parentElement
        return element?.outerHTML
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Size", "Color Code"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Color Code']) {
        product.color = optionsObj.Color || optionsObj['Color Code']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

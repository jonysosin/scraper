import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Size", "Color", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
      const sizeChartUrl = await page.evaluate(() => {
        /**
         * Iterate through the <p> elements in description
         *  till we find 'Click here for a chart'. Then get its href attribute
         */
        const selector = document.querySelectorAll('.product-single__description p')
        if (selector) {
          const elements = Array.from(selector)
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].textContent?.trim().includes('for a size chart')) {
              return elements[i].querySelector('a')?.getAttribute('href')?.trim()
            }
          }
        }
        return null
      })
      if (sizeChartUrl) {
        product.sizeChartUrls = [sizeChartUrl]
      }
    },
  },
  {},
)

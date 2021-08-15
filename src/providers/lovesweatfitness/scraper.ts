import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const detailsKeys = 'div.hup_product-tab ul#tabs.no-bullets > li:not(:first-child) > a'
        const detailValues = 'div.hup_product-tab > div.panel:not(:first-of-type) ul '
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll(detailsKeys))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll(detailValues))

        // Join the two arrays in a key value object
        return values.map((value, i) => {
          return {
            name: keys[i]?.textContent?.trim() || `key_${i}`,
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart Url
       */
      extraData.sizeChartUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product-single__description p img'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      //["Meal Plan", "Title", "Plan", "Color", "Size"]
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

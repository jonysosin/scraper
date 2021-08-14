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
        const keysSelector = '#accordion > div > h3'
        const valuesSelector = '#accordion > div > div'

        // Get a list of titles
        const keys = Array.from(document.querySelectorAll(keysSelector))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll(valuesSelector))

        // Join the two arrays
        return values.map((value, i) => {
          const name = keys[i]?.textContent?.trim() || `key_${i}`
          return {
            name,
            content: value?.outerHTML?.trim() || '',
            description_placement:
              name === 'DESCRIPTION' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Style", "Amount", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

      /**
       * The product title is in the product level, not the variant
       */
      product.title = providerProduct.title
    },
  },
  {},
)

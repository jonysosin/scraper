import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Title", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
    },
  },
  {},
)

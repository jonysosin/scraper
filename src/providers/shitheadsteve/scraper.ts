import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Size", "Color", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      product.sizeChartUrls = [
        'https://cdn.shopify.com/s/files/1/0501/5483/2067/files/Screen_Shot_2020-10-15_at_10.20.03_AM_copy.png?v=1602771712',
      ]
    },
  },
  {},
)

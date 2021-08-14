// import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
// import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Color", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get the URL for the size chart (it's the same in all the page)
       */
      product.sizeChartUrls = [
        'https://cdn.shopify.com/s/files/1/2612/1482/files/Untitled-3_2048x.jpg?v=1606239748',
      ]
    },
  },
  {},
)

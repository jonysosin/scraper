import parseUrl from 'parse-url'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = parseUrl(url)
      return {
        jsonUrl: `https://shop.flybyjing.com${parsedUrl.pathname}`,
        htmlUrl: `https://flybyjing.com/shop${parsedUrl.pathname.replace(/^\/products/, '')}`,
      }
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Title", "Size", "Color", "Sauce", "TOP", "BOTTOM"]
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

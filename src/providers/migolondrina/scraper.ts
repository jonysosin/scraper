import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Extract the videos from the videos section
       */
      extraData.videos = await page.evaluate(() => {
        return (
          Array.from(document.querySelectorAll('.Modal--videoContent iframe'))
            // @ts-ignore
            .map(e => e.dataset?.src || '')
            .filter(e => e !== '') || []
        )
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * ["Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

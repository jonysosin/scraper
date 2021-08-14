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
        return Array.from(document.querySelectorAll('.breadcrumbs li'))
          .map(e => e?.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Denominations", "Shade", "Combination"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.Shade) {
        product.color = optionsObj.Color || optionsObj.Shade
      }
    },
  },
  {},
)

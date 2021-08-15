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
        const breadcrumbsSelector = document.querySelector('nav.breadcrumb')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('/')
              .map(e => e?.trim())
              .filter(e => e !== '')
          : []
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (8) ["Size", "Title", "COLOR", "Custom", "Color", "SIZE", "AMOUNT", "One Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.COLOR) {
        product.color = optionsObj.Color || optionsObj.COLOR
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size.split(/ - */gm)[0]
      }
    },
  },
  {},
)

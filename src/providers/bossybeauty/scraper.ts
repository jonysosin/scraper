import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return document
          .querySelector('div.breadcrumb')
          ?.textContent?.split('\n')
          .map(e => e.trim())
          .filter(e => e)
      })

      return extraData
    },
    variantFn: async (_request, _page, product) => {
      /**
       * Normalize the brand
       */
      if (product.brand && ['Bossy Lipstick!'].includes(product.brand)) {
        product.brand = 'Bossy Cosmetics Inc'
      }
    },
  },
  {},
)

import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('nav.breadcrumbs li')).map(
          e => e.textContent?.trim() || '',
        )
      })

      /**
       * Get the video (if it exists)
       */
      const video = await page.evaluate(() => {
        return document.querySelector('.mfp-iframe')?.getAttribute('src')
      })
      if (video) {
        extraData.videos = [video]
      }

      return extraData
    },
  },
  {},
)

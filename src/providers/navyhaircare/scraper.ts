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
        const accordions = Array.from(
          document.querySelectorAll('div.t7-product-buttons-container > div'),
        )

        const keys = accordions.map(e => {
          const key = e
            ?.getAttribute('data')
            ?.replace(/<h2>(.*)<\/h2>.*/, '$1')
            .trim()
          return key
        })
        const values = accordions?.map(e => {
          const value = e?.getAttribute('data')?.replace(/^<h2>.*<\/h2>/, '')
          return value
        })

        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of videos
       */

      const videos = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('div.video-section iframe')).map(
          e => e?.getAttribute('src') || '',
        )
        if (videos.length) return videos
        return []
      })

      product.videos = videos

      /**
       * Get the list of options for the variants of this provider
       * (2) ["Title", "Ounces"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Ounces) {
        product.size = optionsObj.Ounces
      }
    },
  },
  {},
)

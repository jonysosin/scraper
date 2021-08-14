import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get additional descriptions and information
       */
      const features = await page.evaluate(() => {
        return document.querySelector('.pdp_features')?.outerHTML?.trim()
      })
      if (features) {
        extraData.additionalSections?.push({
          name: 'Features',
          content: features,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      return extraData
    },
  },
  {},
)

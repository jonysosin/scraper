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
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Although Size doesnt come by default from the json, we hard add it to get variants sizes
       * (2) ["Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

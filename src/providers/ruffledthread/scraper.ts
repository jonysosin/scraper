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
        const description = document.querySelector('.ProductMeta__Description')?.textContent?.trim()

        return [
          {
            name: 'Description' || '',
            content: description || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Replace description for the entire description in the product
       */
      product.description = product.additionalSections[0].content
      product.additionalSections?.shift()

      /**
       * Get the list of options for the variants of this provider
       * (3) ["Size", "Title", "Stitching"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

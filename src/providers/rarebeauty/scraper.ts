import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get key value pairs from tags
       */
      extraData.keyValuePairs = Object.fromEntries(
        providerProduct.tags
          .map(e => e.split(':'))
          .map(pair => {
            pair[1] = pair[1]?.trim() || pair[0]?.trim() // Default to key for those tags that are not key value
            return pair
          }),
      )

      /**
       * Bullets
       */
      extraData.bullets = await page.evaluate(() => {
        const sectionLis = Array.from(
          document.querySelectorAll('.pv-extra-details__claims-wrapper p'),
        )
        return sectionLis.map(e => e?.textContent?.trim() || '') || []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.pv-extra-details__section > h2'))?.map(
          e => e.textContent,
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.pv-extra-details__section > p'))?.map(
          e => e.outerHTML,
        )

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Shade", "Give back"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Shade) {
        product.color = optionsObj.Shade
      }
    },
  },
  {},
)

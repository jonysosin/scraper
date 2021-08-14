import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get additional descriptions and information
       */
      const adjacentSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('[data-page] div.w-full > div.font-semibold:not(.text-16)'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('[data-page] div.w-full div.flex-wrap'),
        ).map(e => e?.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = adjacentSections.concat(extraData.additionalSections || [])
      return extraData
    },
    variantFn: async () => {
      /**
       * Get the list of options for the variants of this provider
       * (7) ["Fill", "Title", "FIll", "Flavor", "Dosage", "Amount", "Scent"]
       */
    },
  },
  {},
)

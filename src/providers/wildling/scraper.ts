import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      const adjacentSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.faq-drawer > label.faq-drawer__title'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.faq-drawer__content')).map(e =>
          e.innerHTML?.trim(),
        )

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      const distantSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.site-main div.container:not(.ng-product-desc-container)'),
        )
        // Get a list of titles
        const keys = section.map(e => e.querySelector('h2')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.outerHTML?.trim())

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = [...adjacentSections, ...distantSections]

      return extraData
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get additional descriptions and information
       */
      const imgWithText = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('#des')).map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map(value => {
          return {
            name: `Img with text`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const lifeStyle = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.center_parallelogram')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = [
          Array.from(document.querySelectorAll('.lifestyleSlider')).reduce(
            (acc, el) => acc + el.outerHTML,
            '',
          ),
        ]

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

      extraData.additionalSections = [...imgWithText, ...lifeStyle]

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '#sizeChart')
      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * ["Size", "Color"]
       */

      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
    },
  },
  {},
)

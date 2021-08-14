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
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.accordions a')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.accordion > div')).map(e =>
          e?.outerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        // Exclude some sections
        return sections.filter(e => !['WHAT OUR CUSTOMERS SAY'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Amount", "Denominations", "Style"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      const higherPrice = await page.evaluate(() => {
        // return document.querySelectorAll('.sub-title')?.textContent?.trim().match(/\d+/)[0]
        return document.querySelector('.sub-title')?.textContent?.trim().match(/\d+/)
      })
      if (higherPrice) {
        product.higherPrice = +higherPrice
      }
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return document
          .querySelector('.breadcrumb')
          ?.textContent?.split('›')
          .map(e => e.trim())
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-description-wrapper ul.tabs li'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-description-wrapper div[id^=tab-]'),
        ).map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'Description' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Pattern", "Color", "Title", "Size", "color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['color']) {
        product.color = optionsObj.Color || optionsObj['color']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as we're capturing in the accordions
       */
      product.additionalSections.shift()
    },
  },
  {},
)

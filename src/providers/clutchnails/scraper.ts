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
          .map(e => e.split('_'))
          .map(pair => {
            pair[1] = pair[1]?.trim() || pair[0]?.trim() // Default to key for those tags that are not key value
            return pair
          }),
      )

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.Product__Tabs > div'))
        // Get a list of titles
        const keys = section.map(e => e.querySelector('button')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('div.Collapsible__Content')?.innerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // The first section is always the same as the description that we're always obtaining, so we remove it
        sections.shift()

        return sections
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Length", "Quantity"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Length) {
        product.size = optionsObj.Length
      }
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get additional descriptions and information
       */
      const details = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('div.product-accordion p.accordion-toggle'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('div.product-accordion div.accordion-content'),
        ).map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          let name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement: name === 'Description' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Filter some sections
        return sections.filter(e => !['Shipping'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = details.concat(extraData.additionalSections || [])

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (11) ["Title", "Style", "Color", "Size", "Cover Color", "Animal", "Set", "Type", "Scent", "Quantity", "Pencil Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Cover Color'] || optionsObj['Pencil Color']) {
        product.color = optionsObj.Color || optionsObj['Cover Color'] || optionsObj['Pencil Color']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

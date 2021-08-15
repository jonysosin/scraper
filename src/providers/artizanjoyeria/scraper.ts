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

        // Exclude the some sections that are not relevant
        return sections.filter(e => !['Return Policy'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.color || optionsObj.COLOR) {
        product.color = optionsObj.Color || optionsObj.color || optionsObj.COLOR
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Default to Artizan Joyeria in different cases
       */
      if (product.brand) {
        // product.brand = ['joyeria-artizan', 'Couya-Ali', 'Fysara-Ali', 'AW Global'].includes(
        //   product.brand,
        // )
        //   ? 'Artizan Joyeria'
        //   : product.brand
        // Default always to the same name
        product.brand = 'Artizan Joyeria'
      }
    },
  },
  {},
)

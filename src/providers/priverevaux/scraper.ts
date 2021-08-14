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
        const keys = Array.from(
          document.querySelectorAll('section#productTabs > ul.pv-tab__menu > li'),
        ).map(e => e.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('section#productTabs > ul.pv-tab__content > li'),
        ).map(e => e.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the Privé Promise section and the Product Details section (as it's included in the main description)
        return sections.filter(e => !['Product Details', 'Privé Promise'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (8) ["Color", "Magnifications", "Magnification", "Title", "Lens", "Type", "Polarized", "Magnifcation"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * The product title is in the product level, not the variant
       */
      product.title = providerProduct.title
    },
  },
  {},
)

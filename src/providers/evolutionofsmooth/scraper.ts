import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

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
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.accordion-container .set'))

        // Get a list of titles
        const keys = section.map(e => e.querySelector('a')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.querySelector('.content')?.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
       const description = await page.evaluate(() => {
        return document.querySelector('.product__description')?.outerHTML?.trim()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      const benefits = await page.evaluate(() => {
        return document.querySelector('.product__benefits')?.outerHTML?.trim()
      })
      if (benefits) {
        extraData.additionalSections?.push({
          name: 'Benefits',
          content: benefits,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * The color is not available anywhere, so we try to get it from the tags by parsing some text
       */
      const color = providerProduct.tags.find(t => t.match(/^color:/))?.split(':')[1]
      if (color) {
        product.color = color
      }

      /**
       * Cut a first element to array additionalSections
       */
      product.additionalSections.shift()

      // Default always to the same name
      product.brand = 'eos'
    },
  },
  {},
)

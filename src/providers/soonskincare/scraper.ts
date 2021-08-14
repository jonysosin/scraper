import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Add "Description" section
       */
      const mainDescription = await page.evaluate(() => {
        return document.querySelector('.product-description')?.outerHTML
      })
      if (mainDescription) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: mainDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.description ul.tabs > li')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.description ul.tabs-content > li'),
        ).map(e => e.outerHTML?.trim())

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Title", "Select Your Kit", "Size", "Quantity", "Color", "Customize"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

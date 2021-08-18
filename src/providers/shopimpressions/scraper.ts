import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
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
        // Get a list of content for the titles above
        const values = Array.from(
          Array.from(document.querySelectorAll('.itemDescriptionWrapper ul')).map(e => e.innerHTML?.trim() || '').filter(e => e !== ''),
        )
        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: 'Additional data',
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
      * This site differs from the others and has a particular description included in the HTML (not the JSON)
      */
       const description = await page.evaluate(() => {
        return document.querySelector('#description')?.outerHTML.trim()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
      * Get Size Chart HTML
      */
       extraData.sizeChartHtml = await page.evaluate(() => {
         return document.querySelector('.sizingChart')?.outerHTML?.replace(/\s*/g, '')
       })

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TShopifyExtraData,
    ) => {
   /**
       * Get the list of options for the variants of this provider
       * (2) ["Size", "Color"]
       */
    const optionsObj = getProductOptions(providerProduct, providerVariant)
    if (optionsObj.Color) {
      product.color = optionsObj.Color
    }
    if (optionsObj.Size) {
      product.size = optionsObj.Size
    }
    /**
     * Cut the first element of array
     */
    product.additionalSections.shift()

    },
  },
  {},
)

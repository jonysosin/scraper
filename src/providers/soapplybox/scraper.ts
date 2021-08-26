import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
       /**
       * Get Size Chart HTML
       */

      extraData.sizeChartHtml = await page.evaluate(() => {
        const element = document.querySelector('.content table')
        return element?.outerHTML
      }) 
      
      /** * Get additional descriptions and information */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        /**
         * Delete table from details
         * 
         */

        document.querySelector('.content table')?.remove()
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-accordion .collapsible .title'),
        ).map(e => e?.textContent?.replace(' +', ''))
        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-accordion .collapsible .content'),
        ).map(e => e?.innerHTML?.trim())
        // Join the two arrays
        const sections = values
          .map((value, i) => {
            return {
              name: keys[i] || `key_${i}`,
              content: value || '',
              description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
            }
          })
          .filter(e => e.name !== 'SHIPPING')

        return sections
      }, DESCRIPTION_PLACEMENT)

      const descriptionSection = await getSelectorOuterHtml(page, '.product-description')
      if (descriptionSection) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: descriptionSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

     
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
       * (4) ["SIZE", "Title", "FINISH", "SINK-SIDE FINISH"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.SIZE) {
        product.size = optionsObj.SIZE
      }

      const gender = product.additionalSections.find(e => e.content.includes('Unisex'))
      if (gender) {
        product.gender = 'Unisex'
      }

      product.additionalSections.shift()

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

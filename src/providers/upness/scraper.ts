import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
export default shopifyScraper(
    { productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
      * This site differs from the others and has a particular description included in the HTML (not the JSON)
      */
      const description = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.leading-relaxed p')).map(e => e.textContent).filter(e => e !== " ").toString()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
      })
      }

      /** * Get additional descriptions and information */
      const adjacentSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from( document.querySelectorAll('[data-page] div.w-full > div.font-semibold:not(.text-16)'), ).map(e => e?.textContent?.trim())
        // Get a list of content for the titles above
        const values = Array.from( document.querySelectorAll('[data-page] div.w-full div.flex-wrap'), ).map(e => e?.innerHTML?.trim())
        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
        return sections
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = adjacentSections.concat(extraData.additionalSections || [])

      const accordion = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.mt-64 div div.border-t button div')).map(e => e?.textContent?.trim())
        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.mt-64 div div.border-t div div div')).map(e => e?.innerHTML?.trim())
        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
        return sections
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = accordion.concat(extraData.additionalSections || [])
    return extraData
      }, variantFn: async (_request, page, product, _providerProduct, _providerVariant) => {

      /** * Get the list of options for the variants of this provider
      * (7) ["Fill", "Title", "FIll", "Flavor", "Dosage", "Amount", "Scent"]
      */



     /**
      * If there´s a higher price in the HTML, use it
      */
      const higherPrice = await page.evaluate(() => {
        const price = document.querySelector('.leading-tight:not(.mb-4) div.ml-16 span.line-through')?.textContent?.replace('$', '')
      return Number(price)
      })
      if (higherPrice) {
        product.higherPrice = higherPrice
      }

      /**
       * Get the vides from the gallery
       */
        const video = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('[data-label=product-images] iframe'))?.map(e => e?.getAttribute('src') || '').filter(e => e !== '')
        })
        product.videos = video
      },
    },
  {},
)

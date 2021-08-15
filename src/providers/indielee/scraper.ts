import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
// import { getSelectorOuterHtml   } from '../../providerHelpers/getSelectorOuterHtml'
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
        const accordions = Array.from(document.querySelectorAll('div.Ingredients__Inner > div'))

        const keys = accordions.map(e => e?.querySelector('h3')?.textContent?.trim())

        const values = accordions?.map(e => {
          e?.querySelector('h3')?.remove
          return e?.outerHTML?.trim()
        })

        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get directions section
       */
      const directionsSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const content = document.querySelector('div.Directions__Inner')?.outerHTML?.trim()

        return {
          name: 'Directions',
          content: content || '',
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        }
      }, DESCRIPTION_PLACEMENT)

      if (directionsSection) {
        extraData.additionalSections?.push(directionsSection)
      }

      /**
       * Get the list of bullets
       */
      const bullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.Icons__Inner > div'))
          .map(e => e?.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      extraData.bullets = bullets

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
       * ["Title", "Size", "5ml Sachet", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size || optionsObj['5ml Sachet'] || optionsObj.Amount) {
        product.size = optionsObj.Size || optionsObj['5ml Sachet'] || optionsObj.Amount
      }
    },
  },
  {},
)

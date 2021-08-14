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
        const accordions = Array.from(document.querySelectorAll('div.Product__Tabs > div'))

        const keys = accordions.map(e => {
          return e?.querySelector('button')?.textContent?.trim()
        })

        const values = accordions?.map(e => {
          return e?.querySelector('div.Collapsible__Content')?.innerHTML?.trim()
        })

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
       * ["Title", "Brow Gel Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Brow Gel Color']) {
        product.color = optionsObj.Color || optionsObj['Brow Gel Color']
      }
    },
  },
  {},
)

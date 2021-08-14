import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(
        (DESCRIPTION_PLACEMENT, parseHtmlTextContent) => {
          /**
           * Get the keys
           */
          const keys = Array.from(
            document.querySelectorAll('div.collapsibles-wrapper > button'),
          ).map((e, i) => {
            if (e.nodeName === 'BUTTON') {
              e?.querySelector('span:last-of-type')?.remove()
            }
            //@ts-ignore
            return e?.innerText?.trim()
          })

          /**
           * Get the values
           */
          const values = Array.from(
            document.querySelectorAll('div.collapsibles-wrapper > div'),
          ).map(e => {
            return e?.outerHTML?.trim()
          })

          /**
           * Pop the last element out as it corresponds to Reviews (which we don't need)
           */

          keys.pop()
          values.pop()

          /**
           * Get the accordions
           */

          let sections = values.map((value, i) => {
            const name = keys[i] || `key_${i}`
            return {
              name: name || '',
              content: value || '',
              description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
            }
          })

          sections = sections.filter(s => s.name !== 'Personal Impact')

          return sections
        },
        DESCRIPTION_PLACEMENT,
      )

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * ["Color", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Size chart URL
       */
      product.sizeChartUrls = ['https://period.co/pages/size-chart']
    },
  },
  {},
)

import { getProductOptions } from '../../providers/shopify/helpers'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      const aditionalSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const arrayData = Array.from(document.querySelectorAll(".productDesc table tr:not(.open):not([style='display: block;'])"))
        const keys:any = []
        const values:any = []
        for (let i = 0; i< arrayData.length ; i++){
          i % 2 == 0? keys.push(arrayData[i]) : values.push(arrayData[i])
        }

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i].textContent?.trim() || `key_${i}`,
            content: value.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const productStory = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const values = Array.from(document.querySelectorAll(".product-story"))

        // Join the two arrays
        const sections = values.map((value) => {
          return {
            name: `Product Story`,
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const mainDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get de values
        const values = Array.from(document.querySelectorAll('.js-product-description table tr'))[1]

        // Join the two arrays
        const sections = [{
            name: `Description`,
            content: values.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          }
        ]

        return sections
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections =[...mainDescription, ...aditionalSection, ...productStory ]

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, "div.human-mode")

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * (2) ["Title", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * Cut the first element from array
       */
      product.additionalSections.shift()
    },
  },
  {},
)

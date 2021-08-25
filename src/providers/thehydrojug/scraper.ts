import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Product bundles doesn't have description in the json.
       * We get it from the page
       */
      const isBundle = await page.$('.product-configurator__info')

      if (isBundle) {
        /**
         * Get main description
         */
        extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
          const title = document.querySelector('.product-configurator__info > h1')
          const description = document.querySelector(
            '.product-configurator__info .product-configurator__col-main',
          )
          return [
            {
              name: title?.textContent?.trim() || '',
              content: description?.outerHTML?.trim() || '',
              description_placement: DESCRIPTION_PLACEMENT.MAIN,
            },
          ]
        }, DESCRIPTION_PLACEMENT)

        /**
         * Get adjacent description
         */
        const adjacentDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
          const adjacent = Array.from(
            document.querySelectorAll('.product-configurator__col--vertical > div'),
          )
          const keys = adjacent.map(e => e.querySelector('h3'))
          const values = adjacent.map(e => e.querySelector('ul'))

          return values.map((value, i) => ({
            name: keys[i]?.textContent?.trim() || '',
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }))
        }, DESCRIPTION_PLACEMENT)

        extraData.additionalSections = [...extraData.additionalSections, ...adjacentDescription]
      }
      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider and only
       * for the products that has colors shown in the page
       * (3) ["Color", "Title", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      console.log(providerVariant.available, providerVariant.id)
      const hasColor = await page.$('.swatch_options div')

      if (optionsObj.Color && hasColor) {
        product.color = optionsObj.Color
      }
    },
  },
  {},
)

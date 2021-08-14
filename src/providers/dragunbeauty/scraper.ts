import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorInnerText } from '../../providerHelpers/getSelectorInnerText'
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
        // @ts-ignore
        const productData = window?.VuexState?.products?.[0]
        return [
          {
            name: 'Description',
            content: productData.description,
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
          {
            name: 'Ingredients',
            content: productData.ingredients,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          },
          {
            name: 'Stunts',
            content: productData.stunts,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      /**
       * Add the "How to use" section
       */
      const howToUseSection = await getSelectorOuterHtml(page, '.how-to-use')
      if (howToUseSection) {
        extraData.additionalSections.push({
          name: 'How to use',
          content: howToUseSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Title", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * Capture the subtitle too
       */
      product.subTitle = await getSelectorInnerText(page, '.color-corrector-powder-text')

      /**
       * This website has a difference in the real_price, we need to consider that
       */
      const discount = await page.evaluate(() => {
        // @ts-ignore
        return window?.VuexState?.products?.[0]?.discount
      })

      if (discount) {
        product.realPrice = Number(discount)
        product.higherPrice = providerVariant.price / 100
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not displayed in this
       */
      product.additionalSections.shift()
    },
  },
  {},
)

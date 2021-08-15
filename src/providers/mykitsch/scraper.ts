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
        const section = Array.from(document.querySelectorAll('.accordion-button'))
        // Get a list of titles
        const keys = section.map(e => e?.textContent?.trim())
        const content = Array.from(document.querySelectorAll('.product-accordions__item-content'))
        // Get a list of content for the titles above
        const values = content.map(e => e.outerHTML?.trim())
        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'Product Description'
                ? DESCRIPTION_PLACEMENT.MAIN
                : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * If there're 2 MAIN descriptions it means that we got a better one than the default.
       * In that case, we remove the default one
       */
      const mainDescriptions =
        [...(product?.additionalSections || []), ...(extraData?.additionalSections || [])]?.filter(
          e => e.description_placement === DESCRIPTION_PLACEMENT.MAIN,
        ) || []
      console.log('Descriptions??', mainDescriptions?.length)
      if (mainDescriptions?.length > 1) {
        console.log('more than 1 description detected. Removing')
        // Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
        product.additionalSections.shift()
      }

      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

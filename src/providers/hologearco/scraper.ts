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
      const accordion = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.faqAccordion '))
        // Get a list of titles
        const keys = section.map(e => e?.querySelector('button')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e?.querySelector('dd')?.outerHTML?.trim())
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

      const distantData = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.product-details__blocks .rich-text__heading'),
        )
        // Get a list of titles
        const keys = section.map(e => e?.textContent?.trim())

        const content = Array.from(
          document.querySelectorAll('.product-details__blocks .rich-text__text'),
        )
        // Get a list of content for the titles above
        const values = content.map(e => e?.outerHTML?.trim())
        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'Product Description'
                ? DESCRIPTION_PLACEMENT.MAIN
                : DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const extraImg = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.product-details__blocks '))
        // Get a list of titles
        // const keys = section.map(e => e?.querySelector('.rich-text__heading')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e =>
          e?.querySelector('.block__image_with_text')?.outerHTML?.trim(),
        )
        // Join the two arrays
        const sections = values.map(value => {
          const name = 'ExtraImagenWithData'
          return {
            name,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const banner = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.banner'))
        // Get a list of titles
        // const keys = section.map(e => e?.querySelector('.rich-text__heading')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e?.outerHTML?.trim())
        // Join the two arrays
        const sections = values.map(value => {
          const name = 'banner'
          return {
            name,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = [...accordion, ...distantData, ...banner, ...extraImg]
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

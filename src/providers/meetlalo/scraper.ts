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
      // The description coming from the json doesnt match the one shown in the page
      const mainDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const content = document.querySelector('.description.playtable')?.outerHTML?.trim() || ''
        return content
          ? {
              name: 'Description',
              content,
              description_placement: DESCRIPTION_PLACEMENT.MAIN,
            }
          : null
      }, DESCRIPTION_PLACEMENT)

      if (mainDescription) {
        extraData.additionalSections?.push(mainDescription)
      }

      const titleInfo = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const accordions = document.querySelector('.product__details.accordion-container')
        let keys: Element[]
        let values: Element[]
        if (accordions) {
          // Get a list of titles
          keys = Array.from(
            document.querySelectorAll('.product__details.accordion-container .ac [role="tab"]'),
          )

          // Get a list of content for the titles above
          values = Array.from(
            document.querySelectorAll(
              '.product__details.accordion-container .ac [role="tabpanel"]',
            ),
          )
        } else {
          // Get a list of titles
          keys = Array.from(document.querySelectorAll('div.tabs > ul li'))

          // Get a list of content for the titles above
          values = Array.from(document.querySelectorAll('div.tab-content'))
        }
        // Join the two arrays in a key value object
        const sections = values.map((value, i) => {
          return {
            name: keys[i]?.textContent?.trim() || `key_${i}`,
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the some sections that are not relevant
        return sections.filter(
          e =>
            !['Frequently Asked Questions', 'Shipping & Returns', 'Ask Us', 'Safety'].includes(
              e.name,
            ),
        )
      }, DESCRIPTION_PLACEMENT)

      const productDetail = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const detailValues = 'div.feature-product-details'
        // Get a list of titles

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll(detailValues))

        // Join the two arrays in a key value object

        return values.map((value, i) => {
          return {
            name: `ProductDetail_${i}`,
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      const productInfoDetail = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const detailValues = 'div.product-info-details'
        // Get a list of titles

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll(detailValues))

        // Join the two arrays in a key value object

        return values.map((value, i) => {
          return {
            name: `ProductInfoDetail_${i}`,
            content: value?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      // const socialDetail = await page.evaluate(DESCRIPTION_PLACEMENT => {
      //   const detailValues = 'section.social-slider-section'
      //   // Get a list of titles

      //   // Get a list of content for the titles above
      //   const values = Array.from(document.querySelectorAll(detailValues))

      //   // Join the two arrays in a key value object

      //   return values.map((value, i) => {
      //     return {
      //       name: `SocialSection_${i}`,
      //       content: value?.outerHTML?.trim() || '',
      //       description_placement: DESCRIPTION_PLACEMENT.DISTANT,
      //     }
      //   })
      // }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = [
        ...titleInfo,
        ...productDetail,
        ...productInfoDetail,
        // ...socialDetail,
      ]

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      // (1) ["Color"]
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * If we could capture another main description, we remove the first one
       */
      const mainSections = product.additionalSections.filter(
        e => e.description_placement === DESCRIPTION_PLACEMENT.MAIN,
      )
      if (mainSections.length > 1) {
        product.additionalSections.shift()
      }
    },
  },
  {},
)

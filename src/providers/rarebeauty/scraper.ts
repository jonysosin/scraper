import { TMediaImage, TMediaVideo } from '../shopify/types'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (request, page, providerProduct) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get key value pairs from tags
       */
      extraData.keyValuePairs = Object.fromEntries(
        providerProduct.tags
          .map(e => e.split(':'))
          .map(pair => {
            pair[1] = pair[1]?.trim() || pair[0]?.trim() // Default to key for those tags that are not key value
            return pair
          }),
      )

      /**
       * Bullets
       */
      extraData.bullets = await page.evaluate(() => {
        const sectionLis = Array.from(
          document.querySelectorAll('.pv-extra-details__claims-wrapper p'),
        )
        return sectionLis.map(e => e?.textContent?.trim() || '') || []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        /**
         * Get sections wrapper
         */
        const accordions = document.querySelector('#extraDetailsAcc')

        if (accordions) {
          /**
           * Get default keys and values
           */

          const keys = Array.from(accordions?.querySelectorAll('span'))?.map(e =>
            e.innerText.trim(),
          )
          const values = Array.from(accordions?.querySelectorAll('div'))?.map(e =>
            e.outerHTML.trim(),
          )

          /**
           * Join the arrays
           */
          let sections = values.map((value, i) => {
            return {
              name: keys[i] || `key_${i}`,
              content: value || '',
              description_placement: DESCRIPTION_PLACEMENT.DISTANT,
            }
          })

          /**
           * Some products have additional content shown in a modal,
           * we get those, if any, and replace its content for the one we previously had in the sections above
           */

          const ingredientsModal = document.querySelector(
            'aside#ingredientsModal div.modal__content',
          )

          if (ingredientsModal) {
            sections.forEach(e => {
              if (e.name === `What's in it?`) {
                e.content = ingredientsModal?.outerHTML.trim()
              }
            })
          }

          const usageModal = document.querySelector('aside#usageModal div.modal__content')

          if (usageModal) {
            sections.forEach(e => {
              if (e.name === `How to use`) {
                e.content = usageModal?.outerHTML.trim()
              }
            })
          }

          return sections
        }
        return []
      }, DESCRIPTION_PLACEMENT)

      const videos = await page.$$eval('.pv__content video.video__video-thumb source', (elements) => {
        return (elements as HTMLSourceElement[]).map((source) => {
          return source.src
        })
      })

      extraData.videos = videos

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Shade", "Give back"]
       */

      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Shade) {
        product.color = optionsObj.Shade
      }

      if (product.color) {
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt === null || e.alt === optionsObj.Shade)
          .map(e => e?.src)
          .filter(e => e !== '')

        if (images.length) {
          product.images = images
        }
      }
    },
  },
  {},
)

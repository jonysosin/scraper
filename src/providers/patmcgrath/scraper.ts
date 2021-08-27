import { TMediaImage } from '../../providers/shopify/types'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get additional descriptions and information (by variant)
       * There are cases in which the product accordion selector differs from other products,
       * so we pass the possible selectors to getWorkingSelector
       */

      const variantTitle = providerVariant.title
      const additionalSections = await page.evaluate(
        (DESCRIPTION_PLACEMENT, variantTitle) => {
          function getWorkingSelector(selectors: string[]) {
            for (let i = 0; i < selectors.length; i++) {
              if (document.querySelectorAll(selectors[i]).length) {
                return selectors[i]
              }
            }
            return ''
          }

          const selector = getWorkingSelector([
            `#accordion > [data-variant="${variantTitle}"]`,
            `#accordion > div`,
          ])

          return Array.from(document.querySelectorAll(selector))
            .map(e => {
              const name = e?.querySelector('h3')?.textContent?.trim() || ``
              return {
                name: e.querySelector('h3')?.textContent?.trim() || '',
                content:
                  e.querySelector('h3')?.parentElement?.querySelector('div')?.outerHTML?.trim() ||
                  '',
                description_placement:
                  name === 'DESCRIPTION'
                    ? DESCRIPTION_PLACEMENT.MAIN
                    : DESCRIPTION_PLACEMENT.ADJACENT,
              }
            })
            .filter(e => !['reviews'].includes(e.name.toLowerCase()))
        },
        DESCRIPTION_PLACEMENT,
        variantTitle,
      )

      product.additionalSections = [...product.additionalSections, ...additionalSections]
      // If there're 2 main descriptions, we need to remove one
      if (
        product.additionalSections?.filter(
          e => e.description_placement === DESCRIPTION_PLACEMENT.MAIN,
        )?.length > 1
      ) {
        product.additionalSections.shift()
      }

      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Style", "Amount", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt?.split('||')[0] === product.color)
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

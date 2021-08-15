import { TMediaImage } from '../../providers/shopify/types'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get additional descriptions and information (by variant)
       */
      const variantTitle = providerVariant.title
      product.additionalSections = await page.evaluate(
        (DESCRIPTION_PLACEMENT, variantTitle) => {
          return Array.from(
            document.querySelectorAll(`#accordion > [data-variant="${variantTitle}"]`),
          )
            .map(e => {
              const name = e?.textContent?.trim() || ``
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
       * The product title is in the product level, not the variant
       */
      product.title = providerProduct.title.split(': ')[0]

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

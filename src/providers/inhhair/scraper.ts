import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // const section = Array.from(document.querySelectorAll('.product-page--description .rte-content'))

        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-page--description .rte-content .accordion__btn'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-page--description .rte-content .accordian__about'),
        ).map(e => e?.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const moreFeatures = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.icon__container')).map(
          e => e.outerHTML,
        )

        return items.join('\n \n')
      })
      if (moreFeatures) {
        extraData.additionalSections?.push({
          name: 'More Features',
          content: moreFeatures,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      const additionalData = await page.evaluate(() => {
        return document.querySelector('.why__container')?.outerHTML
      })
      if (additionalData) {
        extraData.additionalSections?.push({
          name: 'Additional Data',
          content: additionalData,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      const howTo = await page.evaluate(() => {
        return document.querySelector('.how__too-img')?.outerHTML
      })
      if (howTo) {
        extraData.additionalSections?.push({
          name: 'How To',
          content: howTo,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       * (2) ["Color", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      } else {
        const color = await page.evaluate(() => {
          //@ts-ignore
          return document.querySelector('.radios--option-current')?.innerText
        })
        if (color) {
          product.color = color
        }
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const color = product.color.replace(/\//g, '-').replace(/\s/, '').toLowerCase()
        const images = await page.evaluate(color => {
          return Array.from(
            document.querySelectorAll(`.product-media--featured img[alt="${color}"]`),
          )
            .map(
              e =>
                e.getAttribute('src')?.replace(/\s.*/, '') ||
                e.getAttribute('data-src')?.replace(/\s.*/, '') ||
                '',
            )
            .filter(e => e !== '')
        }, color)

        if (images.length) {
          product.images = images
        }
      }
    },
  },
  {},
)

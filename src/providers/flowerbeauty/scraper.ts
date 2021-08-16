import { TMediaImage } from '../shopify/types'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const introduction = await page.evaluate(() => {
        return document
          .querySelector('#shopify-section-pdp p.text-redViolet.tracking-wider')
          ?.outerHTML?.trim()
      })
      if (introduction) {
        extraData.additionalSections?.push({
          name: 'Introduction',
          content: introduction,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Ingredients list
       */
      const ingredients = await page.evaluate(() => {
        const headings = document.evaluate(
          "//button[contains(., 'Full Ingredients List')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = headings.iterateNext()
        // @ts-ignore
        return thisHeading?.nextElementSibling?.outerHTML || ''
      })
      if (ingredients) {
        extraData.additionalSections?.push({
          name: 'Full Ingredients List',
          content: ingredients,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * How to use
       */
      const howToUse = await page.evaluate(() => {
        const headings = document.evaluate(
          "//h2[contains(., 'How to Use')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = headings.iterateNext()
        return thisHeading?.parentElement?.parentElement?.outerHTML || ''
      })
      if (howToUse) {
        extraData.additionalSections?.push({
          name: 'How to Use',
          content: howToUse,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * Add videos
       */
      extraData.videos = await page.evaluate(() =>
        Array.from(document.querySelectorAll('video source'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== ''),
      )

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Shade", "Title", "Color", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Shade) {
        product.color = optionsObj.Shade
      }
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const color = product.color
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => {
            const relatedVariants =
              e.alt
                ?.split(',')
                .map(e => e.trim().split('|'))
                .flat()
                .map(e => e.replace(/\*/g, '')?.trim()) || []
            return relatedVariants.includes(color)
          })
          .map(e => e?.src || '')
          .filter(e => e !== '')

        // Add the featured image at the beginning
        if (providerVariant?.featured_image.src) {
          images.unshift(providerVariant?.featured_image?.src)
        }
        if (images.length) {
          product.images = images
        }
      }
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getProductOptions } from '../../providers/shopify/helpers'
import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import { TMediaImage } from '../shopify/types'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.breadcrumbs_list li'))
          .map(e => e.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('[role=tablist] li'))
          .map(e => e?.textContent?.replace(/\+$/, '').trim() || '')
          .filter(e => !['REVIEWS'].includes(e))

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-info__content [role=tabpanel]'),
        ).map(e => e?.outerHTML?.replace(/\+$/, '').trim() || '')

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'What it is' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * Add the bullets on the left
       */
      extraData.bullets = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.product-detail__icons li'))
          .map(e => e.textContent?.trim() || '')
          .filter(e => e !== ''),
      )

      /**
       * If there're videos in the sections below, add them
       */
      extraData.videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product-detail__video-wrap iframe'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Color", "Size"]
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
        const color = product.color.toLowerCase()
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt === `color: ${color}`)
          .map(e => e?.src)
          .filter(e => e !== '')

        if (images.length) {
          product.images = images
        }
      }

      /**
       * The product has a subtitle, we need to add it
       */
      product.subTitle = (await getSelectorTextContent(page, '.pdf__subtitle')) || undefined

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

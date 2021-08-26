import { TMediaImage } from '../shopify/types'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Bullets
       */
      extraData.bullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product-features__carousel > div'))
          .map(e => e.textContent?.trim() || '')
          .filter(e => e !== '')
      })
      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('#product-description ul > li')).map(e =>
          e.querySelector('a')?.textContent?.trim(),
        )
        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-description-panel__content'),
        ).map(e => e?.outerHTML?.trim())
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

      /**
       * Get additional features to product
       */
      const allProductsAre = await page.evaluate(() => {
        return document.querySelector('.product-features')?.outerHTML?.trim()
      })
      if (allProductsAre) {
        extraData.additionalSections?.push({
          name: 'All Products Are',
          content: allProductsAre,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }
      /**
       * Extract the videos from the videos section
       */
      extraData.videos = await page.evaluate(() => {
        const videoId = document
          .querySelector('.product-detail__video div.video-player')
          ?.getAttribute('data-video-id')
        return videoId ? [`https://www.youtube.com/watch?v=${videoId}`] : []
      })
      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (2) ["Title", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const color = product.color.toLowerCase()
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt === `${color}` || e.alt?.replace(/\s-.*/, '') === `${color}`)
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

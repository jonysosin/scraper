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
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.ac-container label:not([for="accordion-description"])'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.ac-container:not(:first-child) .ac-small'),
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

      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.ac-container label:not([for="accordion-description"])'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.ac-container:not(:first-child) .ac-small'),
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

      return extraData
    },
    variantFn: async (_request, page, product) => {
      /**
       * Get a list of videos
       */
      const videoSelectorExists = await page.evaluate(() => {
        const videoSelector = document.querySelector('.video-background')
        // @ts-ignore
        videoSelector?.click()
        return !!videoSelector
      })

      if (videoSelectorExists) {
        await page.waitForSelector('#shopify-section-product-template iframe')
        const modalVideo = await page.evaluate(() => {
          return (
            document
              .querySelector('#shopify-section-product-template iframe')
              ?.getAttribute('src') || ''
          ).replace(/^\/\//, '')
        })
        if (modalVideo) {
          product.videos = [modalVideo, ...product.videos]
        }
      }
    },
  },
  {},
)

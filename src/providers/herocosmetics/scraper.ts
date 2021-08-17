import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import _ from 'lodash'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const features = await page.evaluate(() => {
        return document
          .querySelector(
            '.product-details .product-details__marketing-container .product-details__marketing-content',
          )
          ?.outerHTML?.trim()
      })
      if (features) {
        extraData.additionalSections?.push({
          name: 'Features',
          content: features,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * Get additional descriptions and information
       */
      const needToKnow = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.product-header__list'))

        // Get a list of titles
        const keys = section.map(e =>
          e.querySelector('.product-header__list-header')?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('.product-header__list-list')?.innerHTML?.trim(),
        )

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

      extraData.additionalSections = needToKnow.concat(extraData.additionalSections || [])

      /**
       * Get additional descriptions and information
       */
      const distantSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll(
            '.product-details .pdp-card:not([class*="pdp-card--hidden-d"])',
          ),
        )

        // Get a list of titles
        const keys = section.map(e => e.querySelector('.pdp-card__header')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.querySelector('.pdp-card__content')?.innerHTML?.trim())

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

      extraData.additionalSections = distantSections.concat(extraData.additionalSections || [])

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get all the videos
       */
      // Check if there's a video between the product gallery pictures
      const openVideoSelectorExists = await page.evaluate(() => {
        const openVideoSelector = document.querySelector('.product-images__video-icon')
        // @ts-ignore
        openVideoSelector?.click()
        return !!openVideoSelector
      })
      if (openVideoSelectorExists) {
        await page.waitForSelector('#ImageVideoContainer iframe')
        const mainVideo = await page.evaluate(() => {
          return document.querySelector('#ImageVideoContainer iframe')?.getAttribute('src') || ''
        })
        if (mainVideo) {
          product.videos = [mainVideo, ...product.videos]
        }
      }

      /**
       * Get extra images
       */
      let images = await page.evaluate(() => {
        const mainImages = Array.from(
          document.querySelectorAll('.product-images__container .product-images__image picture'),
        )
          .map(e => e.querySelector('source')?.getAttribute('srcset') || '')
          .filter(e => e.split('=')[2].length > 0)
        const bottomImages = Array.from(
          document.querySelectorAll('.product-details__marketing-imagewrap > img'),
        )
          .map(e => e.getAttribute('src') || '')
          .filter(e => e.split('=')[2].length > 0)
        const animatedImage = document
          .querySelector('.product-images__images-wrapper iframe')
          ?.getAttribute('src')
        return [...mainImages, ...bottomImages, animatedImage]
      })

      if (images.length) {
        product.images = _.compact(images)
      }

      /**
       * Some videos appear in the product.images
       * Filter them and add them to product.videos
       */
      const extractedVideos = product.images.filter(e => e.includes('vimeo'))
      product.videos = [...product.videos, ...extractedVideos]
    },
  },
  {},
)

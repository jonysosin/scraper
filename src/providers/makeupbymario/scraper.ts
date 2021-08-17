import parseUrl from 'parse-url'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = parseUrl(url)
      return {
        jsonUrl: `https://shop.makeupbymario.com${parsedUrl.pathname}`,
        htmlUrl: `https://www.makeupbymario.com${parsedUrl.pathname}`,
      }
    },
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      await page.waitForSelector('.products mat-expansion-panel')
      /**
       * Get additional descriptions and information
       */
      const additionalDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.products mat-expansion-panel'))
        // Get a list of titles
        const keys = section.map(e => e.querySelector('span')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.querySelector('div')?.outerHTML?.trim())

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

      if (additionalDescription) {
        additionalDescription.forEach(description => {
          extraData.additionalSections?.push(description)
        })
      }

      const videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.learn-video video'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })
      if (videos.length) {
        extraData.videos = videos
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /*
          * Get the list of options for the variants of this provider
          ["Color"]
          */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      await page.waitForSelector('.products .ng-star-inserted .product-parsed-desc')
      const description = await page.evaluate(() => {
        return document
          .querySelector('.products .ng-star-inserted .product-parsed-desc')
          ?.textContent?.trim()
      })

      const video = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.learn-video--video')).map(
          e => e.querySelector('video')?.getAttribute('src') || '',
        )
      })

      if (video) {
        product.videos = video
      }

      product.description = description

      product.additionalSections.shift()
    },
  },
  {},
)

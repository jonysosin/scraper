import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.attributes__row > div'))
        // Get a list of titles
        const keys = section.map(e => e.querySelector('h4')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.innerHTML?.trim())

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * Bullets
       */
      extraData.bullets = await page.evaluate(() => {
        const sectionLis = Array.from(document.querySelectorAll('.attributes__row > div ul li'))
        return sectionLis.map(li => li.textContent?.trim() || '') || []
      })

      /**
       * Add videos
       */
      const videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.video__wrapper video '))
          .map(e => e.querySelector('source')?.getAttribute('src') || '')
          .filter(e => e !== '')
      })
      if (Array.isArray(videos) && videos.length) {
        extraData.videos = videos
      }

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.size-guide-sidebar')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

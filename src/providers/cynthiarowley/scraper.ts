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
        const section = Array.from(document.querySelectorAll('#deets .caret-wrapper'))
        // Get a list of titles
        const keys = section.map(e => e.querySelector('a.trigger')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.querySelector('div.slide-target')?.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'Details & Care'
                ? DESCRIPTION_PLACEMENT.MAIN
                : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the some sections that are not relevant
        return sections.filter(e => !['Shipping & Returns'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      /**
       * Extract the 360 videos (if any)
       */
      extraData.videos = await page.evaluate(() => {
        return [
          ...new Set(
            Array.from(document.querySelectorAll('.easyvideo-overlay-play-icon img'))
              // @ts-ignore
              .map(e => e.dataset?.evAlt || '')
              .filter(e => e !== ''),
          ),
        ]
      })

      console.log('extraData.videos', extraData.videos)
      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '#size-chart .wrapper')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is captured later with a better title
       */
      product.additionalSections.shift()
    },
  },
  {},
)

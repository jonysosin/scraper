import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
        const section = Array.from(document.querySelectorAll('#product-tabs > div'))
        // Get a list of titles
        const keys = section.map(e => e.querySelector('button')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('div.Collapsible__Inner')?.innerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the some sections that are not relevant
        return sections.filter(e => !['Return Policy'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Size", "Color", "Title", "Give back"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const video = await page.evaluate(() => {
        return document
          .querySelector('.ProductMeta button[data-video-id]')
          ?.getAttribute('data-video-id')
      })

      if (video) {
        product.videos.push(video)
      }

      /**
       * Get the title from the HTML
       */
      const title = await getSelectorTextContent(page, '.ProductMeta__Title')
      if (title) {
        product.title = title
      }
    },
  },
  {},
)

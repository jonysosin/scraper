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
        // Get a list of titles
        const tabs = Array.from(document.querySelectorAll('.tabs #tabs-nav li:not(.hide)'))

        // Join the two arrays
        const sections = tabs.map((tab, i) => {
          const tabId = tab.querySelector('a')?.getAttribute('href')?.replace('#', '')
          const content = document.querySelector(`.tabs #tabs-content div#${tabId}`)
          return {
            name: tab.textContent?.trim() || `key_${i}`,
            content: content?.innerHTML.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections.filter(e => e.name === 'Description')

      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML (it only appears in an accordion in some products, so we should look for it in the additionalSections)
       */
      const sizeChartHtml = extraData.additionalSections.find(
        e => e.name === 'Ring Sizing',
      )?.content
      if (sizeChartHtml) {
        extraData.sizeChartHtml = sizeChartHtml
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Title", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

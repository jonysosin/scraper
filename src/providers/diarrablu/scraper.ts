import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const liElements = Array.from(document.querySelectorAll('nav.breadcrumbs li'))
        return liElements.map(e => e.textContent?.trim() || '')
      })

      /**
       * Get key value pairs from tags
       */
      extraData.keyValuePairs = Object.fromEntries(
        providerProduct.tags
          .map(e => e.split('_'))
          .map(pair => {
            pair[1] = pair[1] || pair[0] // Default to key for those tags that are not key value
            return pair
          }),
      )

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.pdp-add-to-cart__extra-contents > div'),
        )
        // Get a list of titles
        const keys = section.map(e => e.querySelector('a')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.innerHTML?.trim())

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
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Size", "Title", "Small Rectangle - 58 x 20 inches - 150cm x 50cm", "Your Foot Width", "Denominations", "Color"]
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

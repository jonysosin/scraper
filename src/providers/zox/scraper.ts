// import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
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
        const keys = Array.from(document.querySelectorAll('span.easyslider-header-text')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.easyslider-content-wrapper')).map(e =>
          e.innerHTML?.trim(),
        )

        // Join the two arrays
        let mainDescription = false
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          const placement =
            name === 'Details' && !mainDescription
              ? DESCRIPTION_PLACEMENT.MAIN
              : DESCRIPTION_PLACEMENT.ADJACENT // For the first "Details" sections, we want MAIN
          if (!mainDescription && name === 'Details') {
            mainDescription = true
          }
          return {
            name,
            content: value || '',
            description_placement: placement,
          }
        })

        // Exclude some sections
        return sections.filter(
          e =>
            ![
              'Giving',
              'Care Instructions',
              'Happiness Guarantee',
              'ZOXLOX - The Best Keychains',
            ].includes(e.name),
        )
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      const sizeChartHtml = extraData.additionalSections.find(e => e.name === 'Size Guide')?.content
      if (sizeChartHtml) {
        extraData.sizeChartHtml = sizeChartHtml
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Size", "Color", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

      /**
       * Hard code the brand
       */
      product.brand = 'ZOX'
    },
  },
  {},
)

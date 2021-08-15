import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const liElements = Array.from(document.querySelectorAll('nav.product-breadcrumbs li'))
        return liElements.map(e => e.textContent?.trim() || '')
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.product-description .product-description__section'),
        )
        // Get a list of titles
        const keys = section.map(e => e.querySelector('h4')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('div.product-description__sectionBody')?.innerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // The first section is always the same as the description that we're always obtaining, so we remove it
        sections.shift()

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      try {
        // Wait for the size chart to load
        await page.waitForSelector('.sizing-chart-container .ks-modal-content-hidden')
      } catch (err) {}
      extraData.sizeChartHtml = await getSelectorOuterHtml(
        page,
        '.sizing-chart-container .ks-modal-content-hidden',
      )

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Color", "Size", "Title", "Material", "Chair Base Colour"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Chair Base Colour']) {
        product.color = optionsObj.Color || optionsObj['Chair Base Colour']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

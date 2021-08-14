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
        const section = Array.from(
          document.querySelectorAll('.pdp-add-to-cart__extra-contents > div'),
        )
        // Get a list of titles
        const keys = section.map(e => e.querySelector('p')?.textContent?.trim())

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
      extraData.sizeChartUrls = await page.evaluate(() => {
        const urls: string[] = []
        Array.from(document.querySelectorAll('.product-form__size-chart img')).forEach(e => {
          const src = e.getAttribute('src') || e.getAttribute('data-src')
          if (src) {
            urls.push(src)
          }
        })

        return urls
      })

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Size", "Amount", "Color", "Type"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get extra images
       */
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(`.media-hero-grid__inner picture`))
          .map(e => e.querySelector('source')?.getAttribute('srcset') || '')
          .filter(e => e !== '')
      })
      if (images.length) {
        product.images = images
      }

      /**
       * Save the Size Chart images as URLs
       */
      product.sizeChartUrls = extraData.sizeChartUrls
    },
  },
  {},
)

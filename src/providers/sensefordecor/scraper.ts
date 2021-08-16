import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
        const breadcrumbsSelector = document.querySelector('.breadcrumb_text')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('/')
              .map(e => e.trim())
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const accordions = Array.from(document.querySelectorAll('div.accordian ul li'))
        // Get a list of titles
        const keys = accordions.map(e => e.querySelector('a p')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = accordions.map(e =>
          e.querySelector('.accordionItemContent')?.outerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name.toLowerCase() === 'description'
                ? DESCRIPTION_PLACEMENT.MAIN
                : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the size chart section
        return sections.filter(
          e =>
            ![
              'Size Chart',
              'Why Buy From Sense For Decor?',
              'Shipping Times & RETURNS',
              'Our Story',
            ].includes(e.name),
        )
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of sizeChartUrls
       */
      const sizeChartUrls = await _page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('.all_images_desktop img'))
        const urls = images?.map(e => `https:${e.getAttribute('src')}` || '')
        return urls
      })
      product.sizeChartUrls = sizeChartUrls ? sizeChartUrls : []

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      // product.additionalSections.shift()

      product.description = providerProduct.description
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/gm, ' ')
        .trim()

      /**
       * Get the list of options for the variants of this provider
       * (3) ["Size", "Title", "Color"]
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
       product.title = product.title.replace(/ : [^-]+$/, '')
    },
  },
  {},
)

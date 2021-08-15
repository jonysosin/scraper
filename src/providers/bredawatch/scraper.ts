import { DESCRIPTION_PLACEMENT } from '../../../src/interfaces/outputProduct'
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
        return document
          .querySelector('#product > div.product-title')
          ?.textContent?.split('>')
          .map(e => e.trim() || '')
      })
      /**
       * Get key value pairs from tags
       */
      extraData.keyValuePairs = Object.fromEntries(
        providerProduct.tags
          .map(e => e.split(':'))
          .map(pair => {
            pair[1] = pair[1]?.trim() || pair[0]?.trim() // Default to key for those tags that are not key value
            return pair
          }),
      )
      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('#prod-desc-details .desc-details-title'))
        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('#prod-desc-details .prod-desc-content'),
        )
        // Join the two arrays
        let sections = values.map((value, i) => {
          return {
            name: keys[i].textContent?.trim() || `key_${i}`,
            content: value.innerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
        // Filter some sections
        sections = sections.filter(e => !['-+warranty', '-+SHIPPING & RETURNS'].includes(e.name))
        return sections
      }, DESCRIPTION_PLACEMENT)
      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')
      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const video = await page.evaluate(() => {
        return document
          .querySelector('.product-image .image .videoWrapper iframe')
          ?.getAttribute('src')
      })

      if (video) {
        product.videos.push(video)
      }

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "Jane - Gold/Gold/Midnight"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
      /**
       * COLOR: The color comes in the name of the variant
       */
      product.color = providerVariant.name.replace(/ - ([^-]+$)/, '$1')

      // await page.waitForSelector("#player")
    },
  },
  {},
)

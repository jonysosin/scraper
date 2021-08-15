import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.product__accordions > div button'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.product__accordions > div > div'))

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i].textContent?.trim() || `key_${i}`,
            content: value.innerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const productShowcase = await page.evaluate(() => {
        return document.querySelector('#ProductShowcase')?.outerHTML?.trim()
      })
      if (productShowcase) {
        extraData.additionalSections?.push({
          name: 'Product Showcase',
          content: productShowcase,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Color", "Size", "Title", "Bundle Color", "Pack Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Bundle Color']) {
        product.color = optionsObj.Color || optionsObj['Bundle Color']
      }
      if (optionsObj.Size || optionsObj['Pack Size']) {
        product.size = optionsObj.Size || optionsObj['Pack Size']
      }

      /**
       * Get the main description correctly
       */
      const descriptionSection = await page.evaluate(() => {
        const blurb = document.querySelector('.product__blurb')
        const learnMore = blurb?.querySelector('a[href="#ProductShowcase"]')
        if (blurb && learnMore) {
          blurb.removeChild(learnMore)
        }
        return blurb?.outerHTML
      })
      if (descriptionSection) {
        // Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
        product.additionalSections.shift()
        product.description = parseHtmlTextContent(descriptionSection)
        product.additionalSections.push({
          name: 'Description',
          content: descriptionSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const images = await page.evaluate(
          color => {
            return Array.from(
              document.querySelectorAll(
                `.product__images .product__image-container[data-color="${color}"] img`,
              ),
            )
              .map(e => e.getAttribute('src') || '')
              .filter(e => e !== '')
          },
          product.color
            .replace(/\//g, '-') // Bylt replaces / with - in color for images
            .replace(/\s.*/, '') // Bylt keeps only first word before space
            .toLowerCase(),
        )
        if (images.length) {
          product.images = images
        }
      }

      /**
       * Normalize the brand
       */
      if (product.brand && ['FLEXFIT'].includes(product.brand)) {
        product.brand = 'BYLT Basics'
      }
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Add "Description" section
       */
      const mainDescription = await page.evaluate(() => {
        return document.querySelector('.product-description .desc p')?.outerHTML.trim()
      })
      if (mainDescription) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: mainDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Get additional descriptions and information
       */
      // Add "PRODUCT SPECIFICATIONS" section
      const productSpecificationSection = await getSelectorOuterHtml(
        page,
        '.product-specifications .product-specs',
      )
      if (productSpecificationSection) {
        extraData.additionalSections?.push({
          name: 'Product Specifications',
          content: productSpecificationSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      // Add "PRODUCT SPECIFICATIONS" section
      const featuredContentSection = await getSelectorOuterHtml(
        page,
        '#shopify-section-product-featured-content',
      )
      if (featuredContentSection) {
        extraData.additionalSections?.push({
          name: 'Featured content',
          content: featuredContentSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (1) ["Title"]
       */

      /**
       * Set fixed brand
       */
      product.brand = 'JBW'

      /**
       * Cut the fist element from additional sections
       */
      product.additionalSections.shift()

      /**
       * Cut a title from | until the final
       */
      product.title = product.title.split(' | ')[0]
    },
  },
  {},
)

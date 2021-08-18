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
      const mainSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const mainDescription = document.querySelector('#tab-1 p')?.outerHTML.trim() || ''
        const alternativeDescription = document.querySelector('.desc span')?.outerHTML.trim() || ''

        const main = {
          name: 'Description',
          content: mainDescription ? mainDescription : alternativeDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        }

        return main
      }, DESCRIPTION_PLACEMENT)
      /**
       * If exists, also add "Product specifications" section
       */
      const distantSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const productSpecifications = document.querySelector('.product-specs')?.outerHTML || ''

        const distant = {
          name: document.querySelector('.product-specifications h6')?.textContent || '',
          content: productSpecifications,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        }

        return distant
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections?.push(mainSection)

      if (!Object.values(distantSection).includes('')) {
        extraData.additionalSections?.push(distantSection)
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
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

// images = document.evaluate(
//   "//style[contains(., 'image-')]",
//   document,
//   null,
//   XPathResult.ANY_TYPE,
//   null,
// )
// // @ts-ignore
// allImages = images.iterateNext().innerHTML

// lala = allImages.replace(/(image-\d).*url\((.*)\)/gim, '$1: $2')

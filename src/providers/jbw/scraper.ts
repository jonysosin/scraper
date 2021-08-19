import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import _ from 'lodash'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Add "Description" section
       */
      const mainSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        /**
         * get ALL the variants for the description selectors
         */
        const description = Object.values({
          first: document.querySelector('#tab-1 p')?.outerHTML.trim() || '',
          second: document.querySelector('.desc span')?.outerHTML.trim() || '',
          third: document.querySelector("[class*='product-description']")?.outerHTML.trim() || '',
          fourth: document.querySelector('.second_chance_desc p')?.outerHTML.trim() || '',
          fifth: document.querySelector('.warranty-title p')?.outerHTML.trim() || '',
        })
          .filter(e => e.length)
          .join('')

        const main = {
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        }

        return main
      }, DESCRIPTION_PLACEMENT)
      /**
       * If exists, also add "Product specifications" section
       * NOTE: Sometimes, it does exists, but it doesn't have any text in it's body
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

      /**
       * Get all the images from the product
       */
      let productImages = await page.evaluate(() => {
        const images = document.evaluate(
          "//style[contains(., 'image-')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        // @ts-ignore
        const allImagesSelector = images.iterateNext()

        // @ts-ignore
        const allImages = allImagesSelector?.innerHTML
          .replace(/\s/gim, '')
          .replace(/\.image/gim, 'image')
          .replace(/{background-image:url\(/gim, ': ')
          .split(';}')
          .map(e => {
            return { [e.split(':')[0]]: e.split(':')[1]?.trim() }
          })

        return allImages
          .map(item => `${Object.values(item).join('').replace(/\)$/, '')}`)
          .filter(image => !image.includes('px'))
          .filter(image => image.includes('shopify'))
      })

      if (productImages.length) {
        product.images = [...product.images, ...productImages]
      }
    },
  },
  {},
)

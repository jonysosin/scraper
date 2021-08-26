import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
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
         * Title selector can change depending on the product
         */
        const description = Object.values({
          first: document.querySelector('#tab-1 p')?.outerHTML.trim() || '',
          second: document.querySelector('.desc p')?.outerHTML.trim() || '',
          third: document.querySelector('.second_chance_desc p')?.outerHTML.trim() || '',
          fourth:
            document.querySelector('.rte.product-description > div p')?.outerHTML.trim() || '',
          fifth: document.querySelector('.column.description span')?.outerHTML.trim() || '',
        })
          .filter(e => e.length || !e.includes('Product Specifications'))
          .join('')

        const main = {
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        }

        return main
      }, DESCRIPTION_PLACEMENT)

      /**
       * Set key value pairs
       */

      extraData.additionalSections?.push(mainSection)

      extraData.keyValuePairs = await page.evaluate(() => {
        document.querySelector('.prod_spec > div')?.remove()

        const keys = Array.from(
          document.querySelectorAll('.product-specs div div span:first-child'),
          // @ts-ignore
        ).map(e => e.innerText?.trim())
        const values = Array.from(
          document.querySelectorAll('.product-specs div div span:last-child'),
          // @ts-ignore
        ).map(e => e.innerText?.trim())

        /**
         * Key value pairs may vary depending on the product
         */

        const secondaryKeys = Array.from(document.querySelectorAll('.prod_spec > div span'))
          // @ts-ignore
          .map(e => e.innerText)
          .filter((item, i) => i % 2 === 0)

        const secondaryValues = Array.from(document.querySelectorAll('.prod_spec > div span'))
          // @ts-ignore
          .map(e => e.innerText)
          .filter((item, i) => i % 2 !== 0)

        const finalKeyValuePairs = keys.length
          ? Object.fromEntries(keys.map((item, i) => [item, values[i]]))
          : Object.fromEntries(secondaryKeys.map((item, i) => [item, secondaryValues[i]]))

        // return Object.fromEntries(keys.map((item, i) => [item, values[i]]))
        return finalKeyValuePairs
      })

      /**
       * If exists, also add "Specifications" as adjacent
       */

      const adjacentSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const key = document.querySelector('.tabs span:nth-child(2)')?.textContent || ''
        const value = document.querySelector('.tabs ul')?.outerHTML || ''

        const adjacent = {
          name: key,
          content: value,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        }

        return adjacent
      }, DESCRIPTION_PLACEMENT)

      if (adjacentSection.content) {
        extraData.additionalSections?.push(adjacentSection)
      }

      // extraData.bullets = [adjacentSection.content]

      /**
       * Again, if exists, add "Product specifications" section as distant
       * NOTE: Sometimes, it does exists, but it doesn't have any content
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

      if (distantSection.content) {
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


import { getSelectorOuterHtml } from 'providerHelpers/getSelectorOuterHtml'
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
        const keys = Array.from(document.querySelectorAll('#horizontalTab > ul > li'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('#horizontalTab > div > div'))

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i].textContent?.trim() || `key_${i}`
          return {
            name,
            content: value.innerHTML?.trim() || '',
            description_placement: name === 'DESCRIPTION' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        sections.shift()

        return sections
      }, DESCRIPTION_PLACEMENT)

       /**
       * Add main description
       */
        const mainDescription = await page.evaluate(() => {
          return document.querySelector('.resp-tab-content p')?.outerHTML.trim()
        })
        if (mainDescription) {
          extraData.additionalSections.push({
            name: 'Description',
            content: mainDescription,
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          })
        }

      /**
       * Add adjacent description
       */
        const adjacentDescription = await page.evaluate(() => {
          const paragraphs = Array.from(document.querySelectorAll(".resp-tab-content:not(.tt-u-clip-hide) > p")).map(e => e?.outerHTML.trim())
          paragraphs.shift()
          paragraphs.shift()
          // paragraphs.pop()
          const  ul = Array.from(document.querySelectorAll(".resp-tab-content:not(.tt-u-clip-hide) > ul")).map(e => e?.outerHTML.trim())
          const adjacent = [...paragraphs, ...ul]
          return adjacent.toString()
        })
        if (adjacentDescription) {
          extraData.additionalSections.push({
            name: 'Adjacent Description',
            content: adjacentDescription,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          })
        }

      return extraData
    },

    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TShopifyExtraData,
    ) => {
      /**
      /**
       * Get the list of options for the variants of this provider
       * (3) ["Title", "Shade", "SHADE"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      const brandsDictionary = ['COCA COLA',
        'ARIEL',
        'AVANI GREGG',
        'JACLYN HILL',
        'JAMES CHARLES',
        'LISA FRANK',
        'MADDIE ZIEGLER',
        'MADISON BEER',
        'NIKITA DRAGUN'
        ]
      const matchedSubBrand = product.title.match(' X ') && product.title.match(brandsDictionary.join('|'))?.[0]
      if (matchedSubBrand) {
        product.subBrand = matchedSubBrand
        product.brand = product.brand
      }

      /**
       * Get higher price
       */
      const higherPrice = await page.evaluate(() => {
        return document.querySelector('#product-price .p-value')?.textContent?.trim().match(/\d+/)
      })
      if (higherPrice) {
        product.higherPrice = Number(higherPrice)
      }

      /**
       * Add video from adjacent description
       */
      product.videos = await page.evaluate(() => {
        return [document.querySelector('.videoWrapper iframe')?.getAttribute('src') || '']
      })
      console.log(product.videos);


      /**
       * Remove the first element of the array, as the additional section captured by
       * the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

    },
  },
  {},
)

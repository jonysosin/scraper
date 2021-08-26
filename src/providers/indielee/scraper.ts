import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
// import { getSelectorOuterHtml   } from '../../providerHelpers/getSelectorOuterHtml'
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
        return document
          .querySelector('nav.breadcrumb')
          ?.textContent?.split('›')
          .map(e => e.trim())
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const accordions = Array.from(document.querySelectorAll('div.Ingredients__Inner > div'))

        const keys = accordions.map(e => e?.querySelector('h3')?.textContent?.trim())

        const values = accordions?.map(e => {
          e?.querySelector('h3')?.remove
          return e?.outerHTML?.trim()
        })

        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get "How to use" section
       */
      const howToUse = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = document.querySelector('section.Directions')
        section?.querySelector('.Heading')?.remove()

        return {
          name: 'How to Use',
          content: section?.outerHTML?.trim() || '',
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        }
      }, DESCRIPTION_PLACEMENT)
      if (howToUse) {
        extraData.additionalSections?.push(howToUse)
      }

      /**
       * Get directions section
       */
      const directionsSection = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const content = document.querySelector('div.Directions__Inner')?.outerHTML?.trim()

        return {
          name: 'Directions',
          content: content || '',
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        }
      }, DESCRIPTION_PLACEMENT)

      if (directionsSection) {
        extraData.additionalSections?.push(directionsSection)
      }

      /**
       * Get the list of bullets
       */
      const bullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.Icons__Inner > div'))
          .map(e => e?.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      extraData.bullets = bullets

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
       * Get the list of options for the variants of this provider
       * ["Title", "Size", "5ml Sachet", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size || optionsObj['5ml Sachet'] || optionsObj.Amount) {
        product.size = optionsObj.Size || optionsObj['5ml Sachet'] || optionsObj.Amount
      }

      /**
       * This page has some videos in the alt of the pictures in "media"
       */
      const videos = providerProduct.media.filter(e => e.alt?.match(/video/)).map(e => e.alt || '')

      const mainVideo = await page.evaluate(() => {
        return document.querySelector('.VideoElement iframe')?.getAttribute('data-src') || ''
      })

      if (videos && videos.length) {
        product.videos = [...product.videos, ...videos, mainVideo]
      }
    },
  },
  {},
)

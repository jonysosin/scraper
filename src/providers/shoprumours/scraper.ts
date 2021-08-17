import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
        return (
          Array.from(document.querySelectorAll('nav.breadcrumb > *'))
            .map(e => e?.textContent?.trim() || '')
            .filter(e => e !== '') || []
        )
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
        const sections = Array.from(document.querySelectorAll('.description .accordion')).map(
          (e, i) => {
            const name = e.querySelector('h2')?.textContent?.trim() || `key_${i}`
            return {
              name,
              content: e.querySelector('div.content')?.outerHTML || '',
              description_placement: i === 0 ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
            }
          },
        )
         //sections.shift()
         return sections
        }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(
        page,
        '#shopify-section-product__size_guide',
      )

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (7) ["Size", "Title", "Color", "Tarot Card", "Zodiac Sign", "Value", "Shape"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get higher price
       */
      const higherPrice = await page.evaluate(() => {
        return document.querySelector('.price s')?.textContent?.match(/\d+/)
      })

       if (higherPrice) {
         product.higherPrice = Number(higherPrice)
       }


      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

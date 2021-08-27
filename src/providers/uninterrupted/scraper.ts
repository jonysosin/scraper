import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      const mainDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const description = document.querySelector('.product-page--excerpt')
        return [
          {
            name: 'Description',
            content: description?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      const distantDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const description = document.querySelector('.product-page--description')
        return [
          {
            name: 'More Details',
            content: description?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections?.push(...mainDescription, ...distantDescription)

      /**
       * Get the sizechart (if any)
       */
      extraData.sizeChartHtml = await page.evaluate(getSelectorOuterHtml => {
        const hasSizeChart = document.querySelector('.product-form--variants a.modal--link')

        if (hasSizeChart) {
          return document.querySelector('.product-form--modal')?.outerHTML?.trim()
        } else return ''
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * ["Size", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the auto generated main description
       */
      product.additionalSections.shift()
    },
  },
  {},
)

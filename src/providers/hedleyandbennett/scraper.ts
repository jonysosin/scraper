import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
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
        return Array.from(document.querySelectorAll('.breadcrumb li')).map(
          e => e.textContent?.trim() || '',
        )
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const key = document
          .querySelector('.product-features-slider__text-column-inner > h2')
          ?.textContent?.trim()
        document.querySelector('.product-features-slider__text-column-inner > h2')?.remove()
        const content = document
          .querySelector('.product-features-slider__text-column-inner')
          ?.outerHTML.trim()

        return [
          {
            name: key || '',
            content: content || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          },
        ]
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
       * (3) ["Title", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
      const color = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.breadcrumb li:last-child')).map(
          e => e.textContent?.split('-')[1].trim() || '',
        )
      })
        
      product.color = color[0]
      

    },
  },
  {},
)

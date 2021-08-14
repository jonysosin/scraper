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
        const breadcrumbsSelector = document.querySelector('div#breadcrumb')
        return breadcrumbsSelector?.textContent
          ?.replace(/\n/gim, '')
          .split('»')
          .map(e => e.trim())
      })

      /**
       * Get Size Chart HTML
       */

      await page.waitForTimeout(3000)
      const sizeChartHTML = await page.evaluate(() => {
        const visibleSizeChart =
          document.querySelector('.table-responsive table')?.outerHTML?.trim() || ''

        const genericSizeChart =
          document.querySelector('.esc-size-guide--popup .modal_content')?.outerHTML?.trim() || ''

        if (visibleSizeChart || genericSizeChart) {
          return `<div>${visibleSizeChart + genericSizeChart}</div>`
        }

        return null
      })

      if (sizeChartHTML) {
        extraData.sizeChartHtml = sizeChartHTML
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Color", "Size", "Title", "SIZE", "Camel"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size || optionsObj.SIZE) {
        product.size = optionsObj.Size || optionsObj.SIZE
      }

      /**
       * Unify
       */
      product.brand = product.brand === 'BLANKWardrobe' ? 'BLANK Wardrobe' : product.brand
    },
  },
  {},
)

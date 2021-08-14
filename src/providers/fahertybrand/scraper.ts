import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(productTitle => {
        const breadcrumbs = document
          .querySelector('[aria-label=Breadcrumb]')
          ?.textContent?.split('/')
          .map(e => e?.trim())
          .filter(e => e !== '')

        // If the breadcrumbs didn't load fully, we manually push the product title to the breadcrumbs array
        // (same result as with breadcrumbs fully loaded)
        if (document.querySelector('[aria-label=Breadcrumb] li span')?.textContent?.trim() === '') {
          breadcrumbs?.push(productTitle)
        }
        return breadcrumbs
      }, providerProduct.title)

      /**
       * Get the details section
       */
      const benefits = await page.evaluate(() => {
        return document.querySelector('.product-app__action-pane__details')?.outerHTML?.trim()
      })
      if (benefits) {
        extraData.additionalSections?.push({
          name: 'Benefits',
          content: benefits,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.size-guide-modal')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Color", "Size", "Inseam", "Belt Loops"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

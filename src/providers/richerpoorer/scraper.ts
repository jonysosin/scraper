import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
        const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('/')
              .map(e => e.trim())
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const key = document.querySelector('.product-info__care h2')?.textContent?.trim()
        const value = document.querySelector('.product-info__care :not(h2)')?.outerHTML.trim()
        // Add missing description
        return [
          {
            name: key || '',
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of sizeChartLinks
       */
      const sizeChartHtml = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.size-guide-charts .tabs__tab'))
        .filter(e => (e as any).style.display ==='block')[0]?.innerHTML?.trim()
      })

      product.sizeChartHtml = sizeChartHtml ? sizeChartHtml : ''

      /**
       * Get the list of options for the variants of this provider
       * (3) ["Color", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      product.images = providerProduct.images.filter(img => img.includes(providerVariant.sku))
    },
  },
  {},
)

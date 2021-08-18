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
        return document.querySelector('.size-guide__content table')?.outerHTML?.trim()
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
       * Filter only images for this variant
       */
      product.images = providerProduct.images.filter(
        img => providerVariant.featured_image.src.split('v=')[1] === img.split('v=')[1],
      )
    },
  },
  {},
)

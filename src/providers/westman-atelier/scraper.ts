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
      // NOT APPLICABLE
      // extraData.breadcrumbs = await page.evaluate(() => {
      //   const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
      //   return breadcrumbsSelector?.textContent
      //     ? breadcrumbsSelector.textContent.replace(/\n/gim, '').split('›')
      //     : []
      // })

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(
            'div.product-ingredients.product-section .product-ingredients__sub-head',
          ),
        )

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            'div.product-ingredients.product-section .product-ingredients__description',
          ),
        )

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].outerHTML?.trim() || `key_${i}`] = value.outerHTML?.trim() || ''
          return acc
        }, {})
      })

      /**
       * Get Size Chart HTML
       */
      // NOT APPLICABLE
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Add image from adjacent description in the product gallery
       */
       const adjacentImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.table-layout__cell > img.product-inspiration__feature-img'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

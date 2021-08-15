import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.breadcrumbs li'))
          .map(e => e?.textContent?.trim() || '')
          .filter(e => e !== '')
      })

       /**
       * Add the "Products Details" section
       */
      const productDetails = await getSelectorOuterHtml(page, '.Product__Details')
      if (productDetails) {
        extraData.additionalSections?.push({
          name: 'Products Details',
          content: productDetails,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant, extraData) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Denominations", "Shade", "Combination"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.Shade) {
        product.color = optionsObj.Color || optionsObj.Shade
      }

      // Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
      product.additionalSections.shift()
       /**
       * Replace the original description with the one displayed in the website
       */
      await page.evaluate(() => {
        document.querySelector('.s-product__dropdown-header')?.remove()
      })
      const descriptionSection = await page.evaluate(() => {
        return document.querySelector('.ProductMeta__Description')?.textContent?.trim()
      })

      if (descriptionSection) {
        product.description = descriptionSection
      }
    },
  },
  {},
)

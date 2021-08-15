import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { TMediaImage } from '../shopify/types'

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
       * Normalize the brand
       */
       if (product.brand && ['Mented'].includes(product.brand)) {
        product.brand = 'Mented Cosmetics'
      }
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Title", "Color", "Denominations", "Shade", "Combination"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.Shade) {
        product.color = optionsObj.Color || optionsObj.Shade
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
       if (product.color) {
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt !== null)
          .filter(e => e.alt === product.color)
          .map(e => e?.src)
          .filter(e => e !== '')

        if (images.length) {
          product.images = images
        }
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

      /**
       * Get the video by clicking preview images (if it exists)
       */
       const videos = await page.evaluate(async () => {
        return Array.from(document.querySelectorAll('.howtouse-container img')).map(
          // @ts-ignore
          e => `https://www.youtube.com/watch?v=${e.dataset?.embed}`,
        )
      })
      videos?.forEach(element => {
        product.videos.push(element)
      })
    },
  },
  {},
)

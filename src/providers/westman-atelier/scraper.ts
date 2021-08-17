import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
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
      page,
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
       * Add images in the product gallery
       */
       const variantId = providerVariant.id.toString()
       
      const images = await page.evaluate(variantId => {
        // return Array.from(document.querySelectorAll('div[data-variant]')).filter(e=> e.getAttribute('data-variant') === variantId).map(e => Array.from(e.querySelectorAll('img')).map(e => e.getAttribute('data-src'))).flat()
        return [...new Set(Array.from(document.querySelectorAll('div[data-variant]')).filter(e=> e.getAttribute('data-variant') === variantId).map(e => Array.from(e.querySelectorAll('img')).map(e => e.getAttribute('data-src') || '')).flat().filter(e => e !== ''))] || []
      }, variantId)
      product.images = [...images]

      /**
      * Add tutorial video
      */
      await page.click('.product-tutorial__cover-link')
      await page.waitForTimeout(3000)
      const videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#product-tutorial-video')).map(
          e => e?.getAttribute('src') || '',
        )
      })

      if (Array.isArray(videos) && videos.length) {
        product.videos = [...product.videos, ...videos]
      }
      
      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

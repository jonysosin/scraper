import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Extract the videos from the videos section
       */
      extraData.videos = await page.evaluate(() => {
        return (
          Array.from(document.querySelectorAll('.video_secton iframe'))
            .map(e => e.getAttribute('src') || '')
            .filter(e => e !== '') || []
        )
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant, extraData) => {
      // Remove iframe from MAIN_DESCRIPTION}

      product.additionalSections[0].content = product.additionalSections[0].content.replace(
        /\<iframe[\w\W]*\<\/iframe\>/,
        '',
      )

      /**
       * Get the list of options for the variants of this provider
       * (4) ["Color", "Title", "Item", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Add the videos in the video section
       */
      product.videos = [...(product.videos || []), ...extraData.videos]
    },
  },
  {},
)

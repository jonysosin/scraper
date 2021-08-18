import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get Size Chart HTML
       */
      await page.click('.product-selector__options .product-selector__option--title__link a')
      await page.waitForTimeout(4000)
 
      extraData.sizeChartHtml = await page.evaluate(() => {
        const element = document.querySelector('.size-chart__table')
        return element?.outerHTML
      }) 

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
       * ["Size"]
       */
         const optionsObj = getProductOptions(providerProduct, providerVariant)
         if (optionsObj.Size) {
           product.size = optionsObj.Size
         }

         /**
       * Replace all the product images 
       */
         const pageImage = await _page.evaluate(() => {
          return Array.from(document.querySelectorAll('section img'))
            .map(e => e.getAttribute('src') || '')
            .filter(e => e !== '')
        })
  

        if (pageImage.length) {
          product.images = pageImage
        }
  
      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.trim().replace(/\s*\([\w\d]+\)$/, '')
    },
  },
  {},
)

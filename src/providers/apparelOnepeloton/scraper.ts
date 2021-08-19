import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { autoScroll } from '../../providerHelpers/autoScroll'
import { request } from 'http'


export default shopifyScraper(
  {
    productFn: async (request, page) => {
      const extraData: TShopifyExtraData = {}
      await page.evaluate(() => {
        localStorage.setItem("userLocationStore", "US");
        localStorage.setItem("ajs_user_traits", '{"country":"US"}');
      });
      await page.goto(request.pageUrl)
      /**
       * Get Size Chart HTML
       */
       await page.waitForSelector('.product-selector__options .product-selector__option--title__link a')
      await page.click('.product-selector__options .product-selector__option--title__link a')
      extraData.sizeChartHtml = await page.evaluate(() => {
        const element = document.querySelector('.modal__content .size-chart')
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
          await autoScroll(_page)
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

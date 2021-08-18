import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('#accordion > a > div'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.gt-america-light-11'))

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i].textContent?.trim() || `key_${i}`,
            content: value.innerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const productDescription = await page.evaluate(() => {
        return document.querySelector('div.courier-regular-12.text-uppercase.mb-3')?.textContent?.trim()
      })
      if (productDescription) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: productDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }



      /**
       * Bullets .filter(e => !e.includes('Chart'))
       */
       extraData.bullets = await page.evaluate(() => {
        const sectionLis = Array.from(document.querySelectorAll('.gt-america-light-11'))
        return sectionLis.map(li => li.textContent?.trim() || '') || []
      })

      /**
       * Get Size Chart HTML
       */
       //
       const size__chart = await getSelectorOuterHtml(page, ('#size').trim())
       if (size__chart){
        extraData.sizeChartHtml = await getSelectorOuterHtml(page, ('.col-lg-4 .m-0').trim())
       }

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
       * (1) ["COLOR"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['COLOR']) {
        product.color = optionsObj.Color || optionsObj['COLOR']
      }

      /**
       * Delete videos (only 2, product 1)
       */
      if (product.videos) {
        product.videos = []
      }

      /**
       * Remove the first element of the array, as the additional section captured by
       * the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

      /**
       * Replace all the product images
       */
       const pageImage = await _page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product .flex-nowrap img'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      if (pageImage.length) {
        product.images = pageImage
      }

    },
  },
  {},
)

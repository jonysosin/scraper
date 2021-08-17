import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelectorAll('ul.breadcrumbs li')

        return breadcrumbsSelector?.length
          ? Array.from(breadcrumbsSelector).map(e => e.textContent || '')
          : []
      })

      /**
       * Add missing bullets
       */
      extraData.bullets = await page.$$eval(
        '.product__ingredients--content > div > div',
        elements => elements.map(element => element?.textContent?.trim() || ''),
      )
      extraData.bullets = await page.$$eval(
        '.product__details--tab-content',
        elements => elements.map(element => element?.textContent?.trim() || ''),
      )

      /**
       * Replace the product's main description for the one appearing below the title
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const description = document.querySelector('.product-info__content')
        return [
          {
            name: 'Description',
            content: description?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ]

      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.product__details--tab > h4'))

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product__details--tab-content'),
        )
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

      /**
       * Get Size Chart HTML
       */

      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.size-chart-modal-contents')

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
       * Remove the auto generated Main description and replace product description
       */
      product.additionalSections.shift()
      product.description = await page.$eval('.product-info__content', e => {
        return e?.textContent?.trim() || ''
      })

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
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')

      /**
       * Remove higher price as it doesn't appear in the pages
       */
      product.higherPrice = undefined

      /**
       * Remove .m3u8 video
       */
      product.videos = product.videos.filter(video => !video.includes('.m3u8'))
    },
  },
  {},
)

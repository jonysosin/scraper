// import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelectorAll('ul.breadcrumb li')
        const breadcrumbs = Array.from(breadcrumbsSelector)?.map(e => e.textContent?.trim() || '')

        return breadcrumbs || []
      })

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '.size-chart--link')

      const shippingBullets = await page.$$eval('.product--description li', lis =>
        lis.map(li => li.textContent!),
      )

      const qualityBullets = await page.$$eval('.product-accordion__list li', lis =>
        lis.map(li => li.textContent!),
      )

      extraData.bullets = shippingBullets.concat(qualityBullets)

      const productDescriptionSection = await page.$eval('.product--description', e => e.outerHTML)
      const extraSections = await page.evaluate(() => {
        const cols = Array.from(
          document.querySelectorAll('#shopify-section-product-fitcare .row > div')!,
        )

        return cols.map(col => {
          const name = col.querySelector('h2 .sr-only')!.textContent!.replace(':', '').toUpperCase()
          const content = col.outerHTML
          const description_placement = 'MAIN_DESCRIPTION'
          return { name, content, description_placement }
        })
      })

      // const descriptionSection = await
      extraData.additionalSections = [
        {
          name: 'PRODUCT DESCRIPTION',
          content: productDescriptionSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        },
        // @ts-ignore
        ...extraSections,
      ]

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Size", "Title", "Sleeve Length", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Get the sizeChartUrl
       */
      const sizeChartUrl = await page.evaluate(() => {
        return document.querySelector('.size-chart--link')?.getAttribute('href')
      })
      if (sizeChartUrl) {
        product.sizeChartUrls = [sizeChartUrl]
      }
    },
  },
  {},
)

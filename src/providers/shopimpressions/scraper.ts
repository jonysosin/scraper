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
        const keys = Array.from(document.querySelectorAll('.itemDescriptionWrapper .text-center'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.itemDescriptionWrapper ul'))
        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i].textContent?.trim() || `key_${i}`,
            content: value.innerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      const sizeChartTitle = await getSelectorOuterHtml(page, '.itemDescSizeStats:first-child')
      const sizeChartContent = await getSelectorOuterHtml(page, '.modalModelFitBody:first-child')
      const modelStatsTitle = await getSelectorOuterHtml(page, '.itemDescSizeStats:first-child')
      const modelStatsContent = await getSelectorOuterHtml(page, '.modalModelFitBody:first-child')
      const sizeChart = sizeChartTitle.concat(sizeChartContent)
      const modelStats = modelStatsTitle.concat(modelStatsContent)

      extraData.sizeChartHtml = sizeChart.concat(modelStats)

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
    },
  },
  {},
)

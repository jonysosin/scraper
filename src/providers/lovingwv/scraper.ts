import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelector('nav.breadcrumb')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('›')
              .map(e => e?.trim())
          : []
      })

      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'table')

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.description > :not(table, meta)'))

        // Get a list of content for the titles above
        const values = section.map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: 'Adjacent description',
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        sections.shift()

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * The description comes with a size chart
       */
      const description = await page.evaluate(() => {
        return document.querySelector('.description > :not(table, meta)')?.outerHTML || ''
      })
      extraData.additionalSections.push({
        name: 'Description',
        content: description,
        description_placement: DESCRIPTION_PLACEMENT.MAIN,
      })

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Title", "Size", "Color", "Display Stand", "Denominations", "Hat Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Hat Color']) {
        product.color = optionsObj.Color || optionsObj['Hat Color']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Cut the first element from array
       */
      product.additionalSections.shift()
    },
  },
  {},
)

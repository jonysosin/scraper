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
        const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent.replace(/\n/gim, '').split('›')
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('[class^=ExpandCollapser_root] > li > button'),
          // @ts-ignore
        ).map(e => e.innerText?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('[class^=ExpandCollapser_root] > li > div'),
        ).map(e => e.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude some sections
        return sections.filter(
          e => !['Styled With', 'Shipping, Pickup, and Returns'].includes(e.name),
        )
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, '[class^=SizeGuideOverlay_root]')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Color", "Size", "Title", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

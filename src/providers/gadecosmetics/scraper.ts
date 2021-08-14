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
        return document
          .querySelector('#breadcrumb')
          ?.textContent?.trim()
          .split('>')
          .map(e => e.replace('‏', '').trim()) // This replace seems like it's doing nothing, but there's a hidden character that we're replacing
          .filter(e => e !== '')
      })
      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('#productInformationTabs > ul > li')).map(
          e => e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('#productInformationTabs > div'))
          .filter(e => e.textContent?.trim() !== '') // There're empty tabs that we don't want
          .map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Color", "Title", "Denominations", "color", "color tab"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['color']) {
        product.color = optionsObj.Color || optionsObj['color']
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

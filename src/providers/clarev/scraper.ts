import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
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
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('›')
              .map(e => e.trim())
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.product-info div.product-info__section'),
        )
        // Get a list of titles
        const keys = section.map(e => e.querySelector('.product-info__header')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('.product-info__content ul')?.innerHTML?.trim(),
        )

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

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (2) ["Color", "Size"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const descriptionSection = await getSelectorOuterHtml(
        page,
        '.product-description',
      )
      if (descriptionSection) {
        // Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
        product.additionalSections.shift()

        product.description = parseHtmlTextContent(descriptionSection)
        product.additionalSections.push({
          name: 'Description',
          content: descriptionSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }
    },
  },
  {},
)

import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(
            '.collapsibles-wrapper--tabs button:not(:last-child):not(:first-child)',
          ),
        ).map(e => e.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            '.collapsibles-content-wrapper .collapsible-content:not(:first-child)',
          ),
        ).map(e => e.querySelector('.collapsible-content__inner')?.outerHTML?.trim())

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
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const benefits = await page.evaluate(() => {
        return document
          .querySelector('.index-section--alt .rte .roller-info .container')
          ?.outerHTML?.trim()
      })
      if (benefits) {
        extraData.additionalSections?.push({
          name: 'The Benefits',
          content: benefits,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const stoneGuide = await page.evaluate(() => {
        return document
          .querySelector('.index-section .rte .stone-guide-info .results-container')
          ?.outerHTML?.trim()
      })
      if (stoneGuide) {
        extraData.additionalSections?.push({
          name: 'The Stone Guide',
          content: stoneGuide,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const whyItWorks = await page.evaluate(() => {
        return document.querySelector('.index-section--alt .rte .product')?.outerHTML?.trim()
      })
      if (whyItWorks) {
        extraData.additionalSections?.push({
          name: 'Why It Works',
          content: whyItWorks,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      //["Title", "Color"]
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
    },
  },
  {},
)

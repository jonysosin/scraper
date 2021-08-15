import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const selectors = Array.from(document.querySelectorAll('.krown-tabs div.titles div, h5:not([class*="krown-tab-title"])'))

        for (let i = 0; i < selectors.length; i++) {
          if (selectors[(i+1)]) {
               if (selectors[i].tagName == selectors[(i+1)].tagName && selectors[(i+1)] != null) {
                  delete selectors[i]
              }
          }
        }

        // Get a list of titles
        const keys = selectors.filter(e => e?.tagName === 'H5').map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = selectors.filter(e => e?.tagName === 'DIV').map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement: (name === 'Sizing' || name === 'Materials') ? DESCRIPTION_PLACEMENT.DISTANT : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude some sections
        return sections.filter(e => !['Shipping & Returns'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)



      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Size", "Title", "Color", "Framed?", "Framing?", "Frame"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const descriptionSection = await page.evaluate(() =>{
        return Array.from(Array.from(document.querySelectorAll('.go-iconic-bullets')).map(e => e.textContent)).filter(e => e !== " ").toString()
      })
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

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
       product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

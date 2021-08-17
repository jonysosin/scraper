import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
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
        const keys = Array.from(document.querySelectorAll('div.container.desktop_only nav li')).map(
          e => e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('div.content > section')).map(e =>
          e?.outerHTML?.trim(),
        )

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const description = await page.evaluate(() => {
        return document.querySelector('.product-single__meta > p')?.outerHTML?.trim()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Get Size Chart HTML
       */
      const sizeChart = extraData.additionalSections.find(s => s.name === 'Dimensions & Specs')
      if (sizeChart) {
        extraData.sizeChartHtml = sizeChart.content
      }

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
       * Replace the original description with the one displayed in the website
       */
      if (extraData.additionalSections?.length) {
        const descriptionSection = extraData.additionalSections.find(s => s.name === 'Description')
        if (descriptionSection) {
          product.description = parseHtmlTextContent(descriptionSection.content)
        }
      }

      /**
       * Get the list of options for the variants of this provider
       * (6) ["Title", "Plans", "Size", "Model", "Card Amount", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }


      /**
       * Get videos
       */
      const video = await page.evaluate(() => {
        return document.querySelector('.full-width-youtube iframe')?.getAttribute('src')
      })

      if (video) {
        product.videos.push(video)
      }
    },
  },
  {},
)

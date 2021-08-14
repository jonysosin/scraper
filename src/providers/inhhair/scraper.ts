import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll('.product-page--description .rte-content'),
        )

        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-page--description .rte-content .accordion__btn'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-page--description .rte-content .accordian__about'),
        ).map(e => e?.innerHTML?.trim())

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

      const goodToKnow = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.icon__container')).map(
          e => e.outerHTML,
        )

        return items.join('\n \n')
      })
      if (goodToKnow) {
        extraData.additionalSections?.push({
          name: 'GOOD TO KNOW',
          content: goodToKnow,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      const aboutOur = await page.evaluate(() => {
        return document.querySelector('.why__container')?.outerHTML
      })
      if (aboutOur) {
        extraData.additionalSections?.push({
          name: 'ABOUT OUR',
          content: aboutOur,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      const howTo = await page.evaluate(() => {
        return document.querySelector('.how__too-img')?.outerHTML
      })
      if (howTo) {
        extraData.additionalSections?.push({
          name: 'HOW TO',
          content: howTo,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

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
       * Get the list of options for the variants of this provider
       * (2) ["Color", "Title"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }

      /**
       * Replace the original description with the one displayed in the website
       */
      const description = await page.evaluate(() => {
        return document
          .querySelector('.product-page--description .rte-content .rte-content > p > span')
          ?.textContent?.trim()
      })

      product.description = description

      product.additionalSections.shift()
    },
  },
  {},
)

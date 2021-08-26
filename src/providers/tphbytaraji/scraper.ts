import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      const descriptions = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(
            '.main-content > div:not(.shopify-section) > [class*=container]',
          ),
        ).map(
          e =>
            e?.parentElement?.querySelector('h2')?.textContent?.trim() ||
            e?.parentElement?.querySelector('[class$=-tit]')?.textContent?.trim(),
        )

        keys.push(
          document
            .querySelector('.pdp__description__content .pdp__description__title')
            ?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            '.main-content > div:not(.shopify-section) > [class*=container]',
          ),
        ).map(e => e?.parentElement?.outerHTML?.trim())

        values.push(
          document
            .querySelector('.pdp__description__content .pdp__description__text')
            ?.outerHTML?.trim(),
        )

        // Join the two arrays
        return values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === "WHAT WE DON'T INCLUDE"
                ? DESCRIPTION_PLACEMENT.DISTANT
                : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      const mainDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get main description bullets
        const mainDescription = document.querySelector('.product-featured-list')?.outerHTML?.trim()

        // Join the two arrays
        return [
          {
            name: 'Description',
            content: mainDescription || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = [...mainDescription, ...descriptions]

      return extraData
    },
    variantFn: async (_request, page, product) => {
      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

      /**
       * Add the new main description as product.description
       */
      const mainDescription =
        product?.additionalSections?.find(
          s => s?.description_placement === DESCRIPTION_PLACEMENT.MAIN,
        )?.content || ''

      product.description = parseHtmlTextContent(mainDescription)

      /**
       * Some products have attributes in bullet format
       */
      product.bullets = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.main-pdp__attribute > div.pdp__attribute')).map(
          e => e?.textContent?.trim() || '',
        ),
      )
    },
  },
  {},
)

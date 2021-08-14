import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return document
          .querySelector('.breadcrumb_text')
          ?.textContent?.split('/')
          .map(e => e?.trim())
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('.product-accordion .product-accordion-title'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.product-accordion .product-accordion-content'),
        ).map(e => e?.innerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)
      const description = await page.evaluate(() => {
        return document.querySelector('.product-accordion-content')?.outerHTML?.trim()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Main ingredients',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Title", "Choose your Glow Oil", "Size", "Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.color = optionsObj.Size
      }

      /**
       * The vendor field is used to add subtitles, so we need to force it to the right one.
       * Also, for those cases, keep that description as a subtitle
       */
      if (product.brand !== 'Sol de Janeiro') {
        product.subTitle = product.brand
      }
      product.brand = 'Sol de Janeiro'

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.bullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product-icons > .product-icon')).map(
          e => e?.textContent?.trim() || '',
        )
      })
    },
  },
  {},
)

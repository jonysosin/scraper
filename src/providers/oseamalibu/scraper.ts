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
          .querySelector('nav.breadcrumb')
          ?.textContent?.split('>')
          .map(e => e?.trim() || '')
      })

      /**
       * Add "Description" section
       */
      const mainDescription = await page.evaluate(() => {
        return document.querySelector('.product-description')?.outerHTML
      })
      if (mainDescription) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: mainDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Add "How to use" section
       */
      const howToUseSection = await page.evaluate(() => {
        return document.querySelectorAll('.section-star-ingredients .detailsSection')?.[0]
          ?.outerHTML
      })
      if (howToUseSection) {
        extraData.additionalSections?.push({
          name: 'How to Use',
          content: howToUseSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add "Benefits" section
       */
      const benefitsSection = await page.evaluate(() => {
        return document.querySelectorAll('.section-star-ingredients .detailsSection')?.[1]
          ?.outerHTML
      })
      if (benefitsSection) {
        extraData.additionalSections?.push({
          name: 'Benefits',
          content: benefitsSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add "Key Ingredients" section
       */
      const keyIngredientsSection = await page.evaluate(() => {
        return document.querySelector('.key-ingredients')?.outerHTML
      })
      if (keyIngredientsSection) {
        extraData.additionalSections?.push({
          name: 'Key Ingredients',
          content: keyIngredientsSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add "Ingredients" section
       */
      const ingredientsSection = await page.evaluate(() => {
        return document.querySelector('#ingredients_popup')?.outerHTML
      })
      if (ingredientsSection) {
        extraData.additionalSections?.push({
          name: 'Ingredients',
          content: ingredientsSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       */
      // (2) ["Size", "Title"]
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

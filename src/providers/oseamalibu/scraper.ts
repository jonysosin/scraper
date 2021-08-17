import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (request, page) => {
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
        const benefits = document.querySelectorAll('.section-star-ingredients .detailsSection')?.[1]
        /**
         * Removing images
         */
        if (benefits) {
          Array.from(benefits.querySelectorAll('img')).forEach(e => e.remove())
        }
        return benefits?.outerHTML
      })
      if (benefitsSection) {
        extraData.additionalSections?.push({
          name: 'Benefits',
          content: benefitsSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add distant section
       */
      const distantSection = await page.evaluate(() => {
        const name = document.querySelector('.key-ingredients h2')?.textContent?.trim()
        const content = document.querySelector('.key-ingredients')

        content?.querySelector('h2')?.remove()
        return {
          name,
          content: content?.outerHTML?.trim(),
        }
      })

      if (Object.keys(distantSection).length) {
        extraData.additionalSections?.push({
          name: distantSection.name || '',
          content: distantSection.content || '',
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
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
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
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

      const images = await page.evaluate(() => {
        let imagesSelector = document.querySelectorAll('img.ingredient-image')
        if (imagesSelector) {
          return Array.from(imagesSelector)
            .map(e => e.getAttribute('src')?.trim() || '')
            .filter(e => e !== '')
        }
        return []
      })
      if (images && images.length) {
        images.forEach(img => product.images.push(img))
      }
    },
  },
  {},
)

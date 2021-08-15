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
        const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('›')
              .map(e => e?.trim())
              .filter(e => e !== '')
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.expand-info .expand-header')).map(e => {
          e.querySelector('.expand-header__icon')?.remove()
          return e?.textContent?.trim()
        })

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.expand-info .expand-content')).map(
          e => e?.outerHTML?.trim(),
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

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const description = await page.evaluate(() => {
        const descriptionSection = document.querySelector('.description')
        descriptionSection?.querySelector('.expand-info')?.remove()
        return descriptionSection?.outerHTML?.trim()
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Add videos
       */
      const videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.video-wrapper iframe'))
          .map(e => e?.getAttribute('src') || '')
          .filter(e => e !== '')
      })
      if (Array.isArray(videos) && videos.length) {
        extraData.videos = videos
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (4) ["Title", "Size", "Color", "Style"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
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

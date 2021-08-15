import parseUrl from 'parse-url'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll('#productAccordion .accordion-section .section-title'),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            '#productAccordion .accordion-section .accordion-section-content',
          ),
        ).map(e => e?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude some sections
        return sections.filter(e => !['FAQs'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      /**
       * Add the embedded videos
       */
      extraData.videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.wistia_embed'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      return extraData
    },
    variantFn: async (request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (6) ["Item", "Title", "Color", "Size", "Scalp Saveur", "Le Vite"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Each variant page has different images, so we need to visit it and get the images
       */
      const parsedUrl = parseUrl(request.pageUrl)
      await page.goto(
        `${parsedUrl.protocol}://${parsedUrl.resource}${parsedUrl.pathname}?variant=${providerVariant.id}`,
      )
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.slide-main img'))
          .map(e => e.getAttribute('src')?.trim() || '')
          .filter(e => e !== '')
      })
      if (images.length) {
        product.images = images
      }
    },
  },
  {},
)

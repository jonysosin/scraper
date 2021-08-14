import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const features = await page.evaluate(() => {
        return document
          .querySelector(
            '.product-details .product-details__marketing-container .product-details__marketing-content',
          )
          ?.outerHTML?.trim()
      })
      if (features) {
        extraData.additionalSections?.push({
          name: 'Features',
          content: features,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * Get additional descriptions and information
       */
      const needToKnow = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(document.querySelectorAll('.product-header__list'))

        // Get a list of titles
        const keys = section.map(e =>
          e.querySelector('.product-header__list-header')?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = section.map(e =>
          e.querySelector('.product-header__list-list')?.innerHTML?.trim(),
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

      extraData.additionalSections = needToKnow.concat(extraData.additionalSections || [])

      /**
       * Get additional descriptions and information
       */
      const distantSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const section = Array.from(
          document.querySelectorAll(
            '.product-details .pdp-card:not([class*="pdp-card--hidden-d"])',
          ),
        )

        // Get a list of titles
        const keys = section.map(e => e.querySelector('.pdp-card__header')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = section.map(e => e.querySelector('.pdp-card__content')?.innerHTML?.trim())

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

      extraData.additionalSections = distantSections.concat(extraData.additionalSections || [])

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * * (3) ["Title", "Size", "Amount"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

   
      await page.click(`.product-images__video-icon`)
      await page.waitForSelector('.product-images__video-box')
      
      const video = await page.evaluate(() => {
        return document
          .querySelector('.product-details__howto-video iframe')
          ?.getAttribute('src')
      })
      const menuVideo =  await page.evaluate(() => {
        return document
          .querySelector('.product-images__video-box iframe')
          ?.getAttribute('src')
      })

      if (video) {
          product.videos.push(video)    
      }
      if (menuVideo){
        product.videos.push(menuVideo)
      }
       /**
       * Get extra images
       */
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-images__container .product-images__image picture'))
        .map(e => e.querySelector('source')?.getAttribute('srcset') || '')
        .filter(e => e.split('=')[2].length > 0)
    })
    if (images.length) {

      product.images = images
    
    }
    },
  },
  {},
)

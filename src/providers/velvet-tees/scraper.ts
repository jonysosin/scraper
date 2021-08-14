// import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
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
        const keys = Array.from(document.querySelectorAll('div.drawer.active > button')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('div.drawer.active > div')).map(e =>
          e?.outerHTML?.trim(),
        )

        // Join the two arrays
        const sections = values.map((value, i) => {
          const name = keys[i] || `key_${i}`
          return {
            name,
            content: value || '',
            description_placement:
              name === 'Description' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude some sections
        return sections.filter(e => !['Shipping'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(
        page,
        '[data-modal=size-guide] > .tab__container',
      )

      extraData.imagesMap = await page.evaluate(() => {
        const images: TShopifyExtraData['imagesMap'] = []
        Array.from(document.querySelectorAll('.media__fluid .product__variant-image')).forEach(
          e => {
            const image = e.querySelector('img')?.getAttribute('src')
            if (image) {
              images.push({
                imageSrc: image,
                // @ts-ignore
                variants: e.dataset.variants.split(','),
              })
            }
          },
        )
        return images
      })

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Color", "Size", "color", "size", "Color Men"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.color || optionsObj['Color Men']) {
        product.color = optionsObj.Color || optionsObj.color || optionsObj['Color Men']
      }
      if (optionsObj.Size || optionsObj.size) {
        product.size = optionsObj.Size || optionsObj.size
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()

      /**
       * Filter only images for this variant
       */
      if (Array.isArray(extraData.imagesMap) && extraData.imagesMap.length) {
        const images: string[] = []
        extraData.imagesMap.forEach(imageData => {
          if (imageData.variants.includes(providerVariant.id.toString())) {
            images.push(imageData.imageSrc)
          }
        })
        product.images = images
      }
    },
  },
  {},
)

import parseUrl from 'parse-url'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (request, page) => {
      const extraData: TShopifyExtraData = {
        additionalSections: [],
      }

      // Remove promotion popups
      await page.setCookie({
        url: `https://www.westman-atelier.com`,
        name: 'KL_FORMS_MODAL',
        value:
          '{%22disabledForms%22:{%22WcN9xR%22:{%22lastCloseTime%22:1629421703}}%2C%22viewedForms%22:{%22WcN9xR%22:1083187}}',
      })
      await page.goto(request.pageUrl)

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(
            'div.product-ingredients.product-section .product-ingredients__sub-head',
          ),
        )

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            'div.product-ingredients.product-section .product-ingredients__description',
          ),
        )

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].outerHTML?.trim() || `key_${i}`] = value.outerHTML?.trim() || ''
          return acc
        }, {})
      })

      /**
       * Get Size Chart HTML
       */
      // NOT APPLICABLE
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      const keyIngredientsSection = await getSelectorOuterHtml(
        page,
        '.product-ingredients__description',
      )
      if (keyIngredientsSection) {
        extraData.additionalSections!.push({
          name: 'Key Ingredients',
          content: keyIngredientsSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      const allIngredients = await getSelectorOuterHtml(page, 'div[data-product-ingredients-modal]')
      if (allIngredients) {
        extraData.additionalSections!.push({
          name: 'All Ingredients',
          content: allIngredients,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      const gucciSection = await getSelectorOuterHtml(page, '.product-inspiration.product-section')
      if (gucciSection) {
        extraData.additionalSections!.push({
          name: 'Product Inspiration',
          content: gucciSection,
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
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Add image from adjacent description in the product gallery
       */
      const adjacentImages = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('.table-layout__cell > img.product-inspiration__feature-img'),
        )
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      /**
       * Add images in the product gallery
       */
      const variantId = providerVariant.id.toString()
      let images = await page.evaluate(variantId => {
        return (
          [
            ...new Set(
              Array.from(document.querySelectorAll('div[data-variant]'))
                .filter(e => e.getAttribute('data-variant') === variantId)
                .map(e =>
                  Array.from(e.querySelectorAll('img')).map(e => e.getAttribute('data-src') || ''),
                )
                .flat()
                .filter(e => e !== ''),
            ),
          ] || []
        )
      }, variantId)

      const videosGallery = images.filter(e => e.includes('player'))
      images = images.filter(e => !e.includes('player'))
      product.images = [...images, ...adjacentImages]

      /**
       * Finally, if there's a floating product image, we get it
       */
      if (product.color) {
        await page.evaluate(variant => {
          document
            .querySelector(`.swatch-list__swatch[data-value="${variant}"] input`)
            // @ts-ignore
            ?.click()
        }, product.color)
        await page.waitForTimeout(1000)
        const floatingImages = await page.evaluate(() => {
          return [
            document.querySelector('.product-float-img__wrapper img')?.getAttribute('src') || '',
            document.querySelector('.product__feature-img__smear-overlay')?.getAttribute('src') ||
              '',
          ].filter(e => e !== '')
        })
        if (floatingImages.length) {
          product.images = [...floatingImages, ...product.images]
        }
      }

      /**
       * Add tutorial video
       */
      await page.click('.product-tutorial__cover-link')
      await page.waitForTimeout(3000)
      const videos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#product-tutorial-video')).map(
          e => e?.getAttribute('src') || '',
        )
      })

      if (Array.isArray(videos) && videos.length) {
        product.videos = [...product.videos, ...videos, ...videosGallery]
      }

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')
    },
  },
  {},
)

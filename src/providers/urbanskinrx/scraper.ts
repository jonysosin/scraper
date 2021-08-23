import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      //@ts-ignore
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelectorAll('ul.breadcrumbs li')

        return breadcrumbsSelector?.length
          ? Array.from(breadcrumbsSelector).map(e => e.textContent)
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.product__details--tab > h4'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.product__details--tab-content'))

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].outerHTML?.trim() || `key_${i}`] = value.outerHTML?.trim() || ''
          return acc
        }, {})
      })

      /**
       * Replace the product's main description for the one appearing below the title
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const description = document.querySelector('.product-info__content')?.outerHTML.trim()
        const alternativeDescription = document
          .querySelector('.product__details--tab-content')
          ?.outerHTML.trim()

        const keys = Array.from(document.querySelectorAll('.product__details--tab h4')).map(e =>
          e.textContent?.trim(),
        )
        const values = Array.from(document.querySelectorAll('.product__details--tab-content')).map(
          e => e.outerHTML.trim(),
        )

        const sections = values.map((item, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: item || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        const distantDescription = {
          name: document.querySelector('.grid-container.product__ingredients--container h2'),
          content: Array.from(document.querySelectorAll('.grid-x.product__ingredients--grid'))
            .map(e => e.outerHTML.trim())
            .join(''),
        }
        return [
          {
            name: 'Description',
            content: description ? description : alternativeDescription || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
          {
            name: distantDescription.name?.textContent || '',
            content: distantDescription.content,
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          },
        ].concat(sections)
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get and set key value pairs
       */
      let keyValueTrim = extraData.additionalSections
        ? extraData.additionalSections
            ?.filter(e => e.name === 'Materials')[0]
            ?.content.replace(/<[^>]*>/g, '?')
            .replace(/\n/g, '')
            .replace(/:/g, '')
            .split('?')
            .map(e => e.trim())
            .filter(e => e !== '')
            .filter(e => e !== '&nbsp;')
        : []

      if (!keyValueTrim) {
        keyValueTrim = extraData.additionalSections
          ? extraData.additionalSections
              ?.filter(e => e.name === 'Ingredients')[0]
              ?.content.replace(/<[^>]*>/g, '?')
              .replace(/\n/g, '')
              .replace(/:/g, '')
              .split('?')
              .map(e => e.trim())
              .map(e => e.replace('-&nbsp;', ''))
              .filter(e => e !== '')
              .filter(e => e !== '&nbsp;')
          : []
      }

      const keys = keyValueTrim?.filter((e, i) => i % 2 === 0)
      const values = keyValueTrim?.filter((e, i) => i % 2 !== 0)

      if (keys) {
        extraData.keyValuePairs = Object.fromEntries(
          keys.map((key, i) => {
            return [key, values[i]]
          }),
        )
      } else {
        extraData.keyValuePairs = {}
      }

      /**
       * Get Size Chart HTML
       */
      // extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      extraData.sizeChartHtml = await page.evaluate(() => {
        return document.querySelector('.size-chart-modal-contents')?.outerHTML.trim()
      })

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
       * Delete higher price why don't use it
       */
      delete product.higherPrice

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')

      product.additionalSections.shift()

      const videos = await page.evaluate(() => {
        return document.querySelector('.learn-how-youtube iframe')?.getAttribute('src')
      })

      if (videos) {
        product.videos.push(videos)
      }
    },
  },
  {},
)

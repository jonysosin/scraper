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
        const description = document.querySelector('.product-info__content')
        const descriptionAdjacent = {
          name: document.querySelector('.product__details--tab h4'),
          content: Array.from(document.querySelectorAll('.product__details--tab-content'))
            .map(e => e.outerHTML.trim())
            .join(),
        }
        const distantDescription = {
          name: document.querySelector('.grid-container.product__ingredients--container h2'),
          content: Array.from(document.querySelectorAll('.grid-x.product__ingredients--grid'))
            .map(e => e.outerHTML.trim())
            .join(''),
        }
        return [
          {
            name: 'Description',
            content: description?.textContent?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
          {
            name: descriptionAdjacent.name?.textContent || '',
            content: descriptionAdjacent.content,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          },
          {
            name: distantDescription.name?.textContent || '',
            content: distantDescription.content,
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      return extraData
    },
    variantFn: async (
      _request,
      _page,
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
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      product.title = product.title.replace(/ - [^-]+$/, '')

      /**
       * Get product higher price
       */
      product.higherPrice = providerProduct.price_max / 100

      product.additionalSections.shift()
    },
  },
  {},
)

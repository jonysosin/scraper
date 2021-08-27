import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { remove } from 'lodash'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = { additionalSections: ({} = []), sizeChartUrls: [] }

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelector('nav.breadcrumb')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent
              .replace(/\n/gim, '')
              .split('›')
              .map(e => e?.trim())
          : []
      })

      /**
       * Get sizeChart from description. Can be image or table
       */
      const sizeChartImg = await page.evaluate(() => {
        const sizeChartImg = document.querySelector('.description img')?.getAttribute('src')
        return sizeChartImg || null
      })

      if (sizeChartImg) {
        extraData.sizeChartUrls?.push(sizeChartImg)
      }

      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'table')

      /**
       * Get description and remove sizecharts from product description
       */
      const description = await page.evaluate(DESCRIPTION_PLACEMENT => {
        /**
         * Remove sizeChart <table> if exists
         */
        const sizeChartTable = document.querySelector('.description table')

        if (sizeChartTable) {
          sizeChartTable.remove()
        }

        /**
         * Get the <p> elements and iterate through them removing every one since the
         * first 'Sizing:' or 'Free shipping:' appearance
         */
        const parsedDescription = Array.from(document.querySelectorAll('.description > p')) || []

        let remove = false
        for (let i = 0; i < parsedDescription.length; i++) {
          if (
            ['sizing:', 'free shipping!', 'free shipping'].includes(
              parsedDescription[i].textContent?.toLowerCase() || '',
            )
          ) {
            remove = true
          }
          if (remove) {
            parsedDescription[i].remove()
          }
        }

        return [
          {
            name: 'Description',
            content: document.querySelector('.description')?.outerHTML?.trim() || '',
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ]
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections?.push(...description)

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Remove auto generated main description
       */
      product.additionalSections.shift()

      /**
       * Get the list of options for the variants of this provider
       * (6) ["Title", "Size", "Color", "Display Stand", "Denominations", "Hat Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj['Hat Color']) {
        product.color = optionsObj.Color || optionsObj['Hat Color']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Check if the dropdown menu doesn't involve size options
       */
      const dropdownMenuColorBoolean = await page.evaluate(() => {
        return (
          document
            .querySelector('.selector-wrapper')
            // @ts-ignore
            ?.innerText?.trim()
            .toLowerCase()
            .includes('color')
        )
      })

      /**
       * Get the selected value of the dropdown menu
       */
      const dropdownMenuColor = await page.evaluate(() => {
        // @ts-ignore
        return document.querySelector('.single-option-selector')?.value
      })

      /**
       * If the dropdown menu includes the word "color", then add it
       */
      if (!product.color && dropdownMenuColorBoolean) {
        product.color = dropdownMenuColor
      }
    },
  },
  {},
)

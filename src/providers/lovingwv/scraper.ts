import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

export default shopifyScraper(
  {
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = { additionalSections: ({} = []) }

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

      const description = {
        name: 'Description',
        content: providerProduct.description.replace(/\<table.*\/table\>/g, ''),
        description_placement: DESCRIPTION_PLACEMENT.MAIN,
      }

      extraData.additionalSections?.push(description)

      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'table')

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
       * Remove meta and sizechart from main description
       */
    },
  },
  {},
)

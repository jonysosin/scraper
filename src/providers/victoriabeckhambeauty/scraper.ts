import parseUrl from 'parse-url'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = parseUrl(url)
      return {
        jsonUrl: `https://shop.victoriabeckhambeauty.com${parsedUrl.pathname}`,
        htmlUrl: `https://victoriabeckhambeauty.com${parsedUrl.pathname}`,
      }
    },
    productFn: async (_request, page, providerProduct) => {
      const extraData: TShopifyExtraData = {}

      /**
       * This page has custom data per variant
       */
      const contentData = await page.goto(
        `https://www.victoriabeckhambeauty.com/assets/data/products/${providerProduct}/index.json`,
      )

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('.breadcrumb > a, .breadcrumb > span:not(.breadcrumb__spacer)'),
        )
          .map(e => e.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.product-description-wrapper > ul > li'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.product-description-wrapper > div'))

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].textContent?.trim() || `key_${i}`] = value.outerHTML?.trim() || ''
          return acc
        }, {})
      })

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
       * (6) ["Color", "Title", "Size", "Shade", "+ Sharpener", "Palette"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.Shade || optionsObj.Palette) {
        product.color = optionsObj.Color || optionsObj.Shade || optionsObj.Palette
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

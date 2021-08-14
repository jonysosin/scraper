import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Add images in the product gallery
       */
      extraData.images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#product-gallery-split img'))
          .map(e => e.getAttribute('src') || '')
          .filter(e => e !== '')
      })

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the group ID from the SKU, as this site doesn't use variants structure.
       * Variant SKU: 0AN4281__121585 => Product SKU: 0AN4281
       */
      product.itemGroupId = providerVariant.sku.split('__')[0]

      /**
       * The color is not available anywhere, so we try to get it from the tags by parsing some text
       */
      const color = providerProduct.tags.find(t => t.match(/^COLOR_/))?.split('_')[1]
      if (color) {
        product.color = color
      }

      /**
       * This website doesn't have a price, so we remove it
       */
      delete product.realPrice
      delete product.higherPrice
    },
  },
  {},
)

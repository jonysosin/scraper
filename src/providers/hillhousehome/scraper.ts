import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }
      /**
       * Get additional descriptions and information
       */
      const details = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(
            'div.productAccordion div.productAccordion__card:not(:first-child) .productAccordion__cardHeader button',
          ),
        ).map(e => e?.textContent?.trim())

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(
            'div.productAccordion div.productAccordion__card:not(:first-child) [data-parent]',
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

        // Filter some sections
        return sections.filter(e => !['Shipping + Returns'].includes(e.name))
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = details.concat(extraData.additionalSections || [])

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (29) ["Color", "Size", "Title", "Adult Size", "Tiny Size", "Top Size", "Bottom Size", "Party Size",
       * "Tablecloth Size", "Type", "Style", "Adult Robe Size 1 (HERS)", "Adult Robe Size 2 (HERS)",
       * "Adult Robe Size 1 (HIS)", "Adult Robe Size 2 (HIS)", "Silk Pillowcase Color", "Headband Color",
       * "Women's Size 1", "Women's Size 2", "Children's Robe Size", "Women's Size", "Men's Size", "Children's Size",
       * "Children's Robe Size:", "Set Size 1 (HIS)", "Set Size 2 (HIS)", "Set Size 1 (HERS)", "Set Size 2 (HERS)", "Baby Size"]
       */

      const optionsObj = getProductOptions(providerProduct, providerVariant)
      const productSize =
        optionsObj.Size ||
        optionsObj['Adult Size'] ||
        optionsObj['Tiny Size'] ||
        optionsObj['Top Size'] ||
        optionsObj['Bottom Size'] ||
        optionsObj['Party Size'] ||
        optionsObj['Tablecloth Size'] ||
        optionsObj['Adult Robe Size 1 (HERS)'] ||
        optionsObj['Adult Robe Size 2 (HERS)'] ||
        optionsObj['Adult Robe Size 1 (HIS)'] ||
        optionsObj['Adult Robe Size 2 (HIS)'] ||
        optionsObj["Women's Size 1"] ||
        optionsObj["Women's Size 2"] ||
        optionsObj["Children's Robe Size"] ||
        optionsObj["Women's Size"] ||
        optionsObj["Men's Size"] ||
        optionsObj["Children's Size"] ||
        optionsObj["Children's Robe Size:"] ||
        optionsObj['Baby Size']
      if (productSize) {
        product.size = productSize
      }
      const productColor =
        optionsObj.Color || optionsObj['Silk Pillowcase Color'] || optionsObj['Headband Color']
      if (productColor) {
        product.color = productColor
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const images = await page.evaluate(
          color => {
            return Array.from(
              document.querySelectorAll(
                `.Product__SlideItem--image div img[data-color="${color}"]`,
              ),
            )
              .map(e => e.getAttribute('src') || e.getAttribute('data-srcset') || '')
              .filter(e => e !== '')
          },
          product.color
            .replace(/\//g, '-') // Bylt replaces / with - in color for images
            .replace(/\s.*/, '') // Bylt keeps only first word before space
            .toLowerCase(),
        )
        if (images.length) {
          product.images = images
        }
      }


      // Replace the <hr> with nothing,
      if (product.description) {
        product.description = product.description?.replace(/----------------------------------------/, '') // Temporal fix.
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

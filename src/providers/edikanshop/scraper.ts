import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}
      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        const breadcrumbsSelector = document.querySelector('nav.breadcrumbs')
        return breadcrumbsSelector?.textContent
          ? breadcrumbsSelector.textContent.replace(/\n/gim, '').split('›')
          : []
      })

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const accordions = Array.from(document.querySelectorAll('.accordion > li'))
        // Get a list of titles
        const keys = accordions.map(e => e.querySelector('a.toggle')?.textContent?.trim())

        // Get a list of content for the titles above
        const values = accordions.map(e => e.querySelector('.inner')?.outerHTML?.trim())

        // Join the two arrays
        const sections = values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })

        // Exclude the some sections that are not relevant
        return sections.filter(
          e => !['Shipping information', 'RETURNS', 'Our Guarantee'].includes(e.name),
        )
      }, DESCRIPTION_PLACEMENT)

      // Commented as it's only getting a mask video for all the products.
      // BE CAREFUL IF YOU WILL UNCOMMENT THIS!
      // /**
      //  * Add the "How to use" section
      //  */
      // const howToUseSection = await getSelectorOuterHtml(
      //   page,
      //   '[data-section-type=featured-video-section]',
      // )
      // if (howToUseSection) {
      //   extraData.additionalSections.push({
      //     name: 'Featured video',
      //     content: howToUseSection,
      //     description_placement: DESCRIPTION_PLACEMENT.DISTANT,
      //   })
      // }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (16) ["Color", "Size", "Ships From", "Title", "Material", "Metal Color", "Length", "Cup Size", "Bands Size",
       * "Shoe Size", "Age Range", "Stretched Length", "Color Type", "Size (Inch)", "Width", "Sale by Pack", "Bundle"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      const color = optionsObj.Color || optionsObj['Metal Color'] || optionsObj['Color Type']
      if (color) {
        product.color = color
      }
      const size = optionsObj.Size || optionsObj.Length || optionsObj['length']
      optionsObj['Cup Size'] ||
        optionsObj['Shoe Size'] ||
        optionsObj['Size (Inch)'] ||
        optionsObj['Width'] ||
        optionsObj['Bands Size']
      if (size) {
        product.size = size

        // For certain options, we need to concatenate them:
        if (!product.size && (optionsObj['Cup Size'] || optionsObj['Bands Size'])) {
          product.size = `${optionsObj['Cup Size']}-${optionsObj['Bands Size']}`
            .replace(/^-/, '')
            .replace(/-$/, '')
        }
        if (
          !product.size &&
          optionsObj['Width'] &&
          (optionsObj['Length'] || optionsObj['length'])
        ) {
          product.size = `${optionsObj['Width']}x${optionsObj['Length'] || optionsObj['length']}`
        }
      }
    },
  },
  {},
)

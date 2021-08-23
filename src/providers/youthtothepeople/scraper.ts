import { getProductOptions } from '../../providers/shopify/helpers'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { htmlToTextArray } from '../../providerHelpers/parseHtmlTextContent'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Add keyValuePairs
       */
      const keyValuePairs = await page.evaluate(() => {
        return {
          tips: document.querySelector('.tips')?.outerHTML || '',
          texture: document.querySelector('.texture')?.outerHTML || '',
          scent: document.querySelector('.scent')?.outerHTML || '',
          benefits: document.querySelector('.benefits')?.outerHTML || '',
          claims: document.querySelector('.claims')?.outerHTML || '',
        }
      })
      extraData.keyValuePairs = Object.fromEntries(
        Object.entries({
          tips: htmlToTextArray(keyValuePairs.tips).join('\n').trim().replace(/^Tip:/, '').trim(),
          texture: htmlToTextArray(keyValuePairs.texture)
            .join('\n')
            .trim()
            .replace(/^Texture:/, '')
            .trim(),
          scent: htmlToTextArray(keyValuePairs.scent)
            .join('\n')
            .trim()
            .replace(/^Scent:/, '')
            .trim(),
          benefits: htmlToTextArray(keyValuePairs.benefits)
            .join('\n')
            .trim()
            .replace(/^Benefits:/, '')
            .trim(),
          claims: htmlToTextArray(keyValuePairs.claims)
            .join('\n')
            .trim()
            .replace(/^Claims:/, '')
            .trim(),
        }).filter(e => e[1] !== ''),
      )

      /**
       * Add Main description
       */
      const mainDescription = await getSelectorOuterHtml(page, '.description')
      if (mainDescription) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: mainDescription,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Add "Key Ingredients" section
       */
      const howToUseSection = await page.evaluate(() => {
        return document.querySelector('#product-extra .how-to-use > .landing-how-to-use')?.outerHTML
      })
      if (howToUseSection) {
        extraData.additionalSections?.push({
          name: 'How to Use',
          content: howToUseSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add "Key Ingredients" section
       */
      const keyIngredientsSection = await page.evaluate(() => {
        return document.querySelector('#product-extra .ingredients > .landing-ingredients')
          ?.outerHTML
      })
      if (keyIngredientsSection) {
        extraData.additionalSections?.push({
          name: 'Ingredients',
          content: keyIngredientsSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Add "Ingredients" section
       */
      const ingredientsSection = await page.evaluate(() => {
        const contentSelector = document.querySelector('.ingredients-modal-content')
        contentSelector?.querySelector('i')?.remove()
        return contentSelector?.outerHTML
      })
      if (ingredientsSection) {
        extraData.additionalSections?.push({
          name: 'Ingredients',
          content: ingredientsSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      const benefitsAndClaimsSection = await getSelectorOuterHtml(
        page,
        '#product-extra .product-extra-content  > div.column.right > div.small',
      )

      if (benefitsAndClaimsSection) {
        extraData.additionalSections?.push({
          name: 'Benefits and claims',
          content: benefitsAndClaimsSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * Get additional descriptions and information (it only applies to some product pages, such as
       * https://www.youthtothepeople.com/products/superberry-hydrate-glow-pride-dream-mask)
       */
      const adjacentSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.shogun-tabs li')).map(e =>
          e?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll('.shogun-tabs-body > div.shogun-tab-content'),
        ).map(e => e.outerHTML?.trim())

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      extraData.additionalSections = [
        ...(extraData.additionalSections || []),
        ...(adjacentSections || []),
      ]

      /**
       * Extract the videos from the videos section
       */
      extraData.videos = await page.evaluate(() => {
        return (
          Array.from(document.querySelectorAll('.landing-images iframe, .shogun-video iframe'))
            .map(e => e.getAttribute('src') || e.getAttribute('data-src') || '')
            .filter(e => e !== '') || []
        )
      })

      extraData.bullets = []
      const extraBullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#product-extra .column-text'))
          .map(x => (x as HTMLElement).innerText!)
          .flatMap(x => x.split('\n'))
          .filter(x => x)
      })
      if (extraBullets) extraData.bullets = extraData.bullets.concat(extraBullets)

      const descriptionBullets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.description li'))
          .map(x => (x as HTMLElement).innerText!)
          .flatMap(x => x.split('\n'))
          .filter(x => x)
      })
      if (descriptionBullets) extraData.bullets = extraData.bullets.concat(descriptionBullets)

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
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const price = await page.$eval('span[itemprop="price"]', x =>
        parseFloat(x.getAttribute('content')!),
      )
      /**
       * Get higher pri
       */
      // const higherPrice = await page.$eval('span[itemprop="price"] .landing-weight ,value', x => {
      //   const match = x.textContent!.match(/\$(\d+) Value/)
      //   return match ? parseFloat(match[1]) : null
      // })

      product.realPrice = price
      // if (higherPrice) {
      //   product.higherPrice = higherPrice
      // }

      /**
       * Cut te first element of additional sections
       */
      product.additionalSections?.shift()

      /**
       * Set a brand
       */
      product.brand = 'Youth To The People'

      const productShowcaseImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.landing-images .image > div'))
          .map(e => (e as HTMLElement).style.backgroundImage)
          .map(src => src.match(/url\(\"(.*)\"\)/)![1])
      })

      if (Array.isArray(productShowcaseImages) && productShowcaseImages.length) {
        product.images = [...product.images, ...productShowcaseImages]
      }
    },
  },
  {},
)

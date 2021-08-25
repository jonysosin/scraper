import _ from 'lodash'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const descriptionDistant = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(
            '#product-details-sizing div.info-popup-content div:not(.forcehide)',
          ),
        )
          .reduce((acc, el) => acc + el.outerHTML, '')
          .trim()
      })

      const nameDescription = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-target=product-details-sizing]'))
          .reduce((acc, el) => acc + el.textContent, '')
          .trim()
      })

      if (descriptionDistant) {
        extraData.additionalSections?.push({
          name: nameDescription,
          content: descriptionDistant,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * The description coming from the json doesn't match the one shown in the page
       */
      const mainDescription = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const content =
          document.querySelector('.description div:not([style^=display])')?.outerHTML?.trim() || ''
        return {
          name: 'Description',
          content,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        }
      }, DESCRIPTION_PLACEMENT)

      if (mainDescription) {
        extraData.additionalSections?.push(mainDescription)
      }

      return extraData
    },
    variantFn: async (_request, page, product, providerProduct, providerVariant) => {
      /**
       * Replacing the description for the last pushed to additionalSections (corresponds to DESCRIPTION_MAIN)
       */
      product.description =
        product.additionalSections[product.additionalSections.length - 1].content
      product.additionalSections?.shift()

      /**
       * Get the list of options for the variants of this provider
       * (4) ["Color", "Size", "Give back", "Zodiac Sign"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      const detailPairs = await page.$$eval('.heading_font[data-vdvalue]', els =>
        (els as HTMLElement[]).map(e => [e.dataset.vdvalue || '', e.innerText || '']),
      )
      const barPairs = await page.$$eval('.bar-value .selected', bars =>
        (bars as HTMLDivElement[]).map(bar => [
          bar.dataset.vdvalue || '',
          bar.dataset.vdmatch || '',
        ]),
      )
      const keyValuePairs = [...detailPairs, ...barPairs]
        .map(([key, value]) => [
          key
            ?.replace(`['description']`, '')
            .replace('[','][')
            .split('][')
            .reverse()[0]
            ?.split('.')
            .reverse()[0]
            ?.replace(/[\'\]]/gm, '') || '',
          value
            .replace(/[\r\n]/gm, ' ')
            .replace(/\s+/gm, ' ')
            .trim(),
        ])
        .filter(([key, value]) => key && value)

      product.keyValuePairs = _.fromPairs(keyValuePairs)
    },
    postProcess: async (product, page) => {
      product.bullets = await page.$$eval('.badges .badge', badges =>
        badges.map(e => (e as HTMLElement).innerText || ''),
      )
    },
  },
  {},
)

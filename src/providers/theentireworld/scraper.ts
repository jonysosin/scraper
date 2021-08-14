import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import parseUrl from 'parse-url'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = parseUrl(url)
      return {
        jsonUrl: `https://entireworld.myshopify.com${parsedUrl.pathname}`,
        htmlUrl: `https://theentireworld.com${parsedUrl.pathname.replace(/^\/products/, '')}`,
      }
    },
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        let mainAdded = 0
        const sections = Array.from(
          document.querySelectorAll('.cb__pr__details .cb__pr__variant-info__section'),
        ).map((e, i) => {
          if (!e.querySelector('h5')) {
            return {
              name: 'Description',
              content: e?.outerHTML,
              description_placement: !mainAdded++
                ? DESCRIPTION_PLACEMENT.MAIN
                : DESCRIPTION_PLACEMENT.ADJACENT,
            }
          } else {
            const name = e.querySelector('h5')?.textContent?.trim() || `key_${i}`
            e.querySelector('h5')?.remove()
            return {
              name,
              content: e?.outerHTML,
              description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
            }
          }
        })

        return sections
      }, DESCRIPTION_PLACEMENT)

      const additionalDescription = await page.evaluate(() => {
        return document
          .querySelector('.cb__pr__specific-item-name')
          ?.parentElement?.outerHTML?.trim()
      })

      if (additionalDescription) {
        extraData.additionalSections.push({
          name: 'Description',
          content: additionalDescription,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get Size Chart HTML
       */
      const sizeGuide = extraData.additionalSections.find(e => e.name === 'Sizing Guide')?.content
      const howToMeasure = extraData.additionalSections.find(
        e => e.name === 'How To Measure',
      )?.content
      if (extraData.additionalSections.find(e => e.name === 'Sizing Guide')) {
        extraData.sizeChartHtml = `<div>
          ${sizeGuide || ''}
          ${howToMeasure || ''}
        </div>`
      }

      // extraData.additionalSections = extraData.additionalSections.filter(
      //   e => !['Sizing Guide', 'How To Measure'].includes(e.name),
      // )

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

      // images [new Set(Array.from(document.querySelectorAll('.product__image-carousel__oflow-wrap')[0].querySelectorAll('picture source')).map(e => e.getAttribute('srcset')?.replace(/\?.*/, '')))]
    },
  },
  {},
)

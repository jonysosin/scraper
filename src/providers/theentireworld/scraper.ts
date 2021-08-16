import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import parseUrl from 'parse-url'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import _ from 'lodash'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = parseUrl(url)
      return {
        jsonUrl: `https://entireworld.myshopify.com${parsedUrl.pathname}`,
        htmlUrl: `https://theentireworld.com${parsedUrl.pathname}`,
      }
    },
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Wait for req with authorization Bearer token
       */
      const res = await page.waitForResponse(res => {
        const req = res.request()
        const headers = req.headers()
        const url = req.url()
        return Boolean(
          url.includes('cdn.contentful.com/spaces/36urz56kgkxo/environments/master/entries') &&
            headers['authorization'],
        )
      })

      const req = res.request()
      const headers = req.headers()
      const token = headers['authorization']
      extraData.token = token

      // Wait for the description to load
      await page.waitForSelector('.cb__pr__details__interest')

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

      /**
       * Fetch item's id to then fetch item's images
       */
      const imagesResponse = await page.evaluate(
        async (product, token) => {
          const idResponse = await (
            await fetch(
              `https://cdn.contentful.com/spaces/36urz56kgkxo/environments/master/entries?content_type=productColorVariant&select=fields.categoryReference%2Csys&fields.slug=${product}&include=1&limit=1`,
              {
                headers: {
                  accept: 'application/json, text/plain, */*',
                  'accept-language': 'es-AR,es-419;q=0.9,es;q=0.8',
                  authorization: token,
                  'cache-control': 'no-cache',
                  pragma: 'no-cache',
                },
                method: 'GET',
                mode: 'cors',
              },
            )
          ).json()

          const id = idResponse.items[0].sys.id
          if (!id) {
            return null
          }

          const imagesResponse = await (
            await fetch(
              `https://cdn.contentful.com/spaces/36urz56kgkxo/environments/master/entries?content_type=product&links_to_entry=${id}&select=fields%2Csys.id&include=5&limit=1`,
              {
                headers: {
                  accept: 'application/json, text/plain, */*',
                  'accept-language': 'es-AR,es-419;q=0.9,es;q=0.8',
                  authorization: token,
                  'cache-control': 'no-cache',
                  pragma: 'no-cache',
                },
                method: 'GET',
                mode: 'cors',
              },
            )
          ).json()

          return imagesResponse
        },
        providerProduct.handle,
        extraData.token || '',
      )

      /**
       * Parse color variant from title
       */
      const images: string[] = []
      const variantColorSplit = providerProduct.title.split('.')
      const variantColor = variantColorSplit[variantColorSplit.length - 2].replace(/\s+/g, '_')

      /**
       * Get and filter images from response
       */
      for (const a of imagesResponse.includes.Asset) {
        const url: string = a.fields.file.url.slice(2)
        if (url.includes(variantColor) && !url.includes('Mobile')) {
          images.push(url)
        }
      }

      product.images = _.compact(images)
    },
  },
  {},
)

import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import _ from 'lodash'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { ProductResponse } from './types'
import { getLdJsonScripts } from '../../utils/extractors'

function parseBullets(desc: string) {
  return [...desc.matchAll(/<li>(.+?)<\/li>/g)].map(m => m[1])
}

const scraper: Scraper = async (request, page) => {
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36 (compatible: Remo/0.1, +https COLON SLASH SLASH www DOT remotasks DOT com/en/info.txt)',
  )

  const navPromise = page.goto(request.pageUrl)

  const api_locale = await new Promise<any>((res, rej) => {
    page.on('response', response => {
      const url = response.url()
      if (url.includes('/products/')) {
        const locale = response.url().match(/\/rest\/(.+)\/products/)![1]
        res(locale)
      }
    })
    setTimeout(() => rej(new Error('Timeout waiting for response')), 60000)
  })

  await navPromise

  const BASE_URL = `https://www.tods.com`
  // us-en or ww-en
  const website_locale = request.pageUrl.replace(`${BASE_URL}/`, '').split('/')[0]

  const BASE_PRODUCT_URL = `${BASE_URL}/${website_locale}`
  const PRODUCTS_API_URL = `${BASE_URL}/rest/${api_locale}/products/`

  const screenshot = await screenPage(page)

  const id = _.last(request.pageUrl.split('/').filter(subpath => subpath.length > 0))!

  const productResponses = await page.evaluate(
    async (id, PRODUCTS_API_URL) => {
      const apiUrl = `${PRODUCTS_API_URL}${id}`
      const res = await fetch(apiUrl)
      const mainResponse: ProductResponse = await res.json()
      const responses: ProductResponse[] = await Promise.all(
        mainResponse.colorSizeOptions.map(async opt => {
          return (await fetch(`${PRODUCTS_API_URL}${opt.skuOrigin}`)).json()
        }),
      )
      return responses
    },
    id,
    PRODUCTS_API_URL,
  )

  const products: Product[] = []

  for (const productResponse of productResponses) {
    const url = `${BASE_PRODUCT_URL}/p/${productResponse.code}`

    // if we get redirected, skip product
    await page.goto(url)
    if (page.url() !== url) {
      continue
    }

    const ldjson = (await getLdJsonScripts(page))[0]

    const additionalSectionDescription = await page.$eval(
      '.detailInfo__description',
      e => e.outerHTML,
    )
    const additionalSectionDetails = await page.$eval('.detailInfo__listWrapper', e => e.outerHTML)

    for (const variantResponse of productResponse.variantOptions) {
      const title = productResponse.name
      const variantId = variantResponse.code
      const product = new Product(variantId, title, url)

      if (variantResponse.color) {
        product.color = variantResponse.color
      }
      product.size = variantResponse.size
      product.availability = !!variantResponse.stock.stockLevel
      product.description = productResponse.summary
      product.bullets = parseBullets(productResponse.description)
      product.images = productResponse.carouselImages.map(c => `https:${c.url}`)
      product.sku = variantResponse.code
      product.brand = ldjson?.brand?.name
      if (ldjson.offers) {
        product.currency = ldjson.offers.priceCurrency
        product.realPrice = ldjson.offers.price
      }
      if (ldjson?.mainEntityOfPage?.breadcrumb?.itemListElement) {
        product.breadcrumbs = ldjson.mainEntityOfPage.breadcrumb.itemListElement.map(
          e => e.item.name,
        )
      }
      if (ldjson?.itemListElement) {
        product.breadcrumbs = ldjson.itemListElement.map(e => e.item.name)
      }

      product.itemGroupId = productResponse.code
      product.matchableIds = [variantResponse.code]

      if (product.breadcrumbs?.includes('Men')) {
        product.gender = 'Men'
      }
      if (product.breadcrumbs?.includes('Women')) {
        product.gender = 'Women'
      }

      product.addAdditionalSection({
        content: additionalSectionDescription,
        description_placement: DESCRIPTION_PLACEMENT.MAIN,
        name: 'DESCRIPTION',
      })
      product.addAdditionalSection({
        content: additionalSectionDetails,
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        name: 'MORE DETAILS',
      })

      products.push(product)
    }
  }

  return {
    screenshot,
    products,
  }
}

export default scraper

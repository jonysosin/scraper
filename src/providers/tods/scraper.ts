import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import _ from 'lodash'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { ProductResponse } from './types'
import { getLdJsonScripts } from '../../utils/extractors'

const BASE_URL = `https://www.tods.com`
const BASE_PRODUCT_URL = `${BASE_URL}/us-en`
const PRODUCTS_API_URL = `${BASE_URL}/rest/v2/tods-ww/products/`

function parseBullets(desc: string) {
  return [...desc.matchAll(/<li>(.+?)<\/li>/g)].map(m => m[1])
}

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)

  const id = _.last(request.pageUrl.split('/'))!

  const productResponses = await page.evaluate(
    async (id, PRODUCTS_API_URL) => {
      const mainResponse: ProductResponse = await (await fetch(`${PRODUCTS_API_URL}${id}`)).json()
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
    const productUrl = `${BASE_PRODUCT_URL}${productResponse.url}`
    await page.goto(productUrl)
    // if we get redirected, skip product
    if (page.url() !== productUrl) {
      continue
    }

    const ldjson = (await getLdJsonScripts(page))[0]

    for (const variantResponse of productResponse.variantOptions) {
      const url = `${BASE_PRODUCT_URL}${variantResponse.url}`
      const title = productResponse.name
      const variantId = `${variantResponse.code}:${variantResponse.color ?? ''}:${
        variantResponse.size ?? ''
      }`
      const product = new Product(variantId, title, url)

      product.color = variantResponse.color
      product.size = variantResponse.size
      product.availability = !!variantResponse.stock.stockLevel
      product.description = productResponse.summary
      product.bullets = parseBullets(productResponse.description)
      product.images = productResponse.carouselImages.map(c => `https:${c.url}`)
      product.sku = variantResponse.code
      product.brand = ldjson?.brand?.name
      product.currency = ldjson.offers.priceCurrency
      product.realPrice = ldjson.offers.price
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
        content: await page.$eval('.detailInfo__description', e => e.outerHTML),
        description_placement: DESCRIPTION_PLACEMENT.MAIN,
        name: 'DESCRIPTION',
      })
      product.addAdditionalSection({
        content: await page.$eval('.detailInfo__listWrapper', e => e.outerHTML),
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        name: 'MORE DETAILS',
      })
      products.push(product)
    }
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

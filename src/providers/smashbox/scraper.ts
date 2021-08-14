import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getLdJsonScripts } from '../../utils/extractors'
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { Response } from './types'
import _ from 'lodash'

const scraper: Scraper = async (request, page) => {
  const navigationPromise = page.goto(request.pageUrl)

  const response: { data: Response } = await new Promise<any>((res, rej) => {
    page.on('response', response => {
      const url = response.url()
      if (
        url.includes('core/v1/extension/v1') &&
        response.request().postData()?.includes('filter: [{product_id:{in:[')
      ) {
        res(response.json())
      }
    })
    setTimeout(() => rej(new Error('Timeout waiting for response')), 120000)
  })

  await navigationPromise

  // @ts-ignore
  const window_page_data = await page.evaluate(() => window.page_data)

  const products_catalog = window_page_data['catalog-spp'].products.filter(x => !!x)

  const ldjson = (await getLdJsonScripts(page))[0]

  const responseData = response.data.products.items

  const products: Product[] = []

  for (const res of responseData) {
    const title = res.display_name
    const url = `https://www.smashbox.com${res.product_url}`

    for (const variant of res.skus.items) {
      const shades = variant.shades ? variant.shades : [undefined]
      for (const shade of shades) {
        const id = variant.sku_id
        const product = new Product(id, title, url)

        product.description = res.description
        product.subTitle = res.short_description
        product.brand = ldjson.brand.name
        product.images = _.uniq(variant.media.large.map(x => `https://www.smashbox.com${x.src}`))
        product.sku =  variant.sku_id
        product.realPrice = variant.prices[0].include_tax.price
        product.higherPrice = variant.prices[0].include_tax.original_price
        product.currency = variant.prices[0].currency
        product.availability = variant.inventory_status === 'Active'
        product.itemGroupId = res.product_id
        if (shade) {
          product.color = shade.name
        }
        product.breadcrumbs = await page.$eval('.elc-breadcrumbs', e =>
          // @ts-ignore
          e.innerText
            .split('\n')
            .filter(x => x !== '/')
            .filter(x => x),
        )

        const additionalDescription = await page.evaluate(() => {
          const match = document.querySelector('.js-product-overview')
          return match ? match.outerHTML : null
        })
        if (additionalDescription) {
          product.addAdditionalSection({
            content: additionalDescription,
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
            name: 'DESCRIPTION',
          })
        }

        const ingredients = await page.evaluate(() => {
          const match = document.querySelector('.js-product-ingredients')
          return match ? match.outerHTML : null
        })

        if (ingredients) {
          product.addAdditionalSection({
            content: await ingredients,
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
            name: 'INGREDIENTS',
          })
        }

        products.push(product)
      }
    }
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

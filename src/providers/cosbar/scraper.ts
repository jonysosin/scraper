import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import _ from 'lodash'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)

  const products: Product[] = []
  const variantMeta = await page.evaluate(() => {
    const products = (window as any).dataLayer.find((a: any) => a.ecommerce).ecommerce.detail
      .products
    if (products.length > 1) throw new Error('expected only one product')
    return products[0]
  })
  const variants = variantMeta.variant ? variantMeta.variant[0].split(',') : [undefined]

  await page.waitForFunction('localStorage.product_data_storage')
  const data = await page.evaluate(() => {
    const obj = JSON.parse(localStorage.product_data_storage)

    if (Object.keys(obj).length > 1) throw new Error('expected only one key')
    return Object.values(obj)[0] as any
  })

  for (const variant of variants) {
    const id = `${data.id}` + (variant ? `:${variant}` : '')
    const product = new Product(id, data.name, data.url)
    product.realPrice = data.price_info.final_price
    product.higherPrice = data.price_info.regular_price
    product.currency = data.currency_code
    product.color = variant
    product.images = data.images.map((d: any) => d.url)
    const baseSku = variantMeta.sku
    product.sku = `${baseSku}|${variant ?? ''}`
    product.brand = (
      await page.$eval('.product.attribute.brandvalue div[itemprop=brandvalue]', e => e.innerHTML)
    ).trim()
    product.description = (
      await page.$eval(
        '#description > .product.attribute.description > .value',
        match => match.textContent ?? '',
      )
    ).trim()
    product.itemGroupId = product.sku.split('|')[0]
    product.breadcrumbs = variantMeta.category_path
    product.bullets = await page.$$eval(
      '#description > .product.attribute.description ul li',
      lis => {
        return lis.map(li => li.innerHTML.replaceAll('<strong>', '').replaceAll('</strong>', ''))
      },
    )

    product.addAdditionalSection({
      content: await page.$eval('#description', match => match.outerHTML),
      description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
      name: 'DESCRIPTION',
    })
    products.push(product)
  }

  const screenshot = await screenPage(page)

  await page.evaluate(() => localStorage.removeItem('product_data_storage'))

  return {
    screenshot,
    products: products,
  }
}

export default scraper

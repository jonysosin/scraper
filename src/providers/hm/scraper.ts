import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import Product from '../../entities/product'
import { notFound } from '../../errors'
import IScraper from '../../interfaces/scraper'
import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import screenPage from '../../utils/capture'
import { extractMetaTags } from '../../utils/extractors'
import { TProductHM } from './types'

const scraper: IScraper = async (request, page) => {
  console.log({ request })

  const response = await page.goto(request.pageUrl, { waitUntil: 'load', timeout: 600000 })

  console.log(`Successfully loaded a page with status ${response.status()}`)
  console.log(`HEADERS: ${JSON.stringify(response.headers())}`)
  const respText = await response.text()
  console.log(`TEXT: ${respText.substring(0, 1024)}`)
  console.log(`CONTENT`)
  console.log((await page.content()).substring(0, 1024))
  console.log('DONE LOGGING ****')

  // Extract all the metaTags
  const metaTags = await extractMetaTags(page)

  // Product data
  await page.waitForFunction(() => {
    // @ts-ignore
    return !!window.productArticleDetails
  })
  const productInformation: TProductHM = await page.evaluate(() => {
    // @ts-ignore
    return window.productArticleDetails
  })

  const articleData = productInformation[productInformation.articleCode]

  const title = await getSelectorTextContent(page, '.product-item-headline')
  if (!title) {
    throw notFound('Product not found in H&M store')
  }
  const product = new Product(productInformation.articleCode, title, request.pageUrl)

  product.title = product.title.replace('\n', '').replace('\t', '').trim()
  product.sku = productInformation.articleCode
  product.brand = 'H&M'
  // product.subBrand =
  product.images = articleData.images.map(i => i.image)
  // product.videos =
  // product.size =
  product.realPrice = Number(articleData.redPriceValue || articleData.whitePriceValue)
  if (articleData.whitePriceValue) {
    product.higherPrice = Number(articleData.whitePriceValue)
  }
  product.availability = articleData.inStore
  product.itemGroupId = product.id.slice(0, -3)
  product.description = articleData.description
  product.currency = 'USD'
  product.color = articleData.name
  product.colorFamily = product.id
  // product.gender =
  product.fbPixelContentId = product.itemGroupId
  product.colorFamily = product.itemGroupId

  /**
   * Description Structured
   */
  product.addAdditionalSection({
    name: 'description text',
    content: await page.$eval('.pdp-content .pdp-description-text', element => element.outerHTML),
    description_placement: DESCRIPTION_PLACEMENT.MAIN,
  })
  product.addAdditionalSection({
    name: 'description list',
    content: await page.$eval('.pdp-content .pdp-description-list', element => element.outerHTML),
    description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
  })
  product.addAdditionalSection({
    name: 'details',
    content: await page.$eval(
      '.product-details-details .pdp-details-content',
      element => element.innerHTML,
    ),
    description_placement: DESCRIPTION_PLACEMENT.DISTANT,
  })
  product.addAdditionalSection({
    name: 'Delivery and Payment',
    content: await page.$eval(
      '.product-details-delivery .pdp-delivery-content',
      element => element.innerHTML,
    ),
    description_placement: DESCRIPTION_PLACEMENT.DISTANT,
  })
  /**
   * Breadcrumbs
   */
  product.breadcrumbs = await page.evaluate(() => {
    const breadcrumbs: string[] = []
    document.querySelectorAll('.breadcrumbs-list li').forEach(element => {
      const text = element.querySelector('span[itemprop=name]')?.textContent
      if (text) {
        breadcrumbs.push(text)
      }
    })
    return breadcrumbs
  })

  const pairs: [string, string[]][] = await page.evaluate(() => {
    const descriptions = document.querySelectorAll(
      '.pdp-description-list .pdp-description-list-item',
    )
    const details = Array.from(descriptions).map(element => {
      const dt = element.querySelector('dt')?.textContent
      let dds = Array.from(element.querySelectorAll('dd ul li'))
      if (dds.length === 0) {
        const dt = element.querySelector('dd')
        dds = dt ? [dt] : []
      }
      return [dt || '', dds.map(e => e.textContent)] as [string, string[]]
    })

    const drawer = Array.from(
      document.querySelectorAll('.pdp-details-content dl .details-attributes-list-item'),
    ).map(element => {
      const key = element.querySelector('dt')?.textContent || ''
      const values = Array.from(element.querySelectorAll('dd')).map(e => e.textContent || '')
      return [key, values] as [string, string[]]
    })

    return [...details, ...drawer]
  })

  product.keyValuePairs = pairs.reduce(
    (obj, [key, value]) => ({ ...obj, [key]: value.join('\n') }),
    {},
  )

  product.metadata = {
    metaTags,
    productInformation,
    articleData,
  }

  const screenshot = await screenPage(page)
  console.log({ screenshot })

  const outOfStock = await page.$$eval('.picker-list li', items =>
    items
      .map(
        item =>
          item.querySelector('span:nth-child(2)') &&
          item.querySelector('span')?.innerText.toUpperCase().trim(),
      )
      .filter(i => !!i),
  )

  const products = articleData.sizes.map(size => {
    const variant = product.clone()
    variant.size = size.name
    variant.matchableIds = [size.sizeCode]

    variant.availability = !outOfStock.includes(size.name?.toUpperCase())

    return variant
  })

  return {
    screenshot,
    products,
  }
}

export default scraper

/* eslint-disable function-paren-newline */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Page } from 'puppeteer'
import Product from '../../entities/product'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { extractMetaTags, getLdJsonScripts, mergeMetaTags } from '../../utils/extractors'
import { WarbyParkerV2, APIV2Products } from './types/warbyparkerv2'
import { WarbyParkerV3, APIV3Products, APIV2Configurations } from './types/warbyparkerv3'
import _ from 'lodash'

const scraper: IScraper = async (request, page) => {
  await page.goto(request.pageUrl)

  await page.waitForSelector('#mainContent')

  const metaTags = await extractMetaTags(page)
  const meta = mergeMetaTags(metaTags)

  const warby: WarbyParkerV2 | WarbyParkerV3 = await page.evaluate(() => {
    // @ts-ignore
    return window.WarbyParker
  })

  await page.waitForSelector('script[type="application/ld+json"]')
  const ldjson = await getLdJsonScripts(page)

  const products: Product[] = []

  const productsResultsKey = Object.keys(warby.api.prefetched).find(k => k.includes('/products/'))!

  const apiVersion = productsResultsKey?.includes('/v2/')
    ? 'v2'
    : productsResultsKey?.includes('/v3/')
    ? 'v3'
    : null
  if (!apiVersion) throw new Error('unsupported api version')

  // -------------------- V2 --------------
  if (apiVersion === 'v2') {
    console.warn('THIS PRODUCT USES V2: ', page.url())

    const api = warby.api.prefetched as WarbyParkerV2['api']['prefetched']

    // @ts-ignore
    const productsResults: APIV2Products = api[productsResultsKey]

    for (const pr of productsResults.products) {
      const group = productsResults.group
      const id = pr.id
      const title = pr.display_name
      const url = `https://www.warbyparker.com/${pr.path}`
      const product = new Product(`${id}`, title, url)

      product.color = pr.color
      product.description = pr.description
      product.availability = pr.in_stock
      product.realPrice = pr.price_cents / 100
      product.images = Object.values(pr.images).map(i => i.replace('//', 'https://'))
      product.itemGroupId = group.id
      product.breadcrumbs = pr.path.split('/')

      products.push(product)
    }
  }

  if (apiVersion === 'v3') {
    const api = warby.api.prefetched as WarbyParkerV3['api']['prefetched']

    // @ts-ignore
    const productsResults: APIV3Products = api[productsResultsKey]

    const productsById = _.keyBy(productsResults.products, p => p.pc_product_id)
    const configurationsKey = Object.keys(api).find(k => k.includes('/configurations/'))!
    const configurationsResults: APIV2Configurations = api[configurationsKey]

    for (const pr of configurationsResults.products) {
      const productExtra = productsById[pr.pc_product_id]

      if (!productExtra) continue

      const color = pr.display_color
      const size = pr.width
      const images = Object.values(pr.images.default).map(i => i.replace('//', 'https://'))
      const path = pr.path
      const itemGroupId = pr.pc_product_id

      for (const conf of pr.configurations) {
        const variant_id = `${conf.pc_product_id}:${conf.config_product_name}`
        const title = conf.config_product_name
        const availability = conf.in_stock
        const price = conf.price_cents / 100
        const breadcrumbs = path.split('/')
        const metadata = { variant: conf, product: pr }
        const description = productExtra.description
        const bullets = productExtra.details_bullet_points
        const gender = productExtra.gender
        const url = `https://www.warbyparker.com/${pr.path}`

        const product = new Product(variant_id, title, url)
        product.availability = availability
        product.realPrice = price
        product.breadcrumbs = breadcrumbs
        product.metadata = metadata
        product.description = description
        product.bullets = bullets
        product.gender = gender
        product.color = color
        product.size = `${size}`
        product.images = images
        product.itemGroupId = `${itemGroupId}`

        products.push(product)
      }
    }
  }

  const screenshot = await screenPage(page)

  return {
    screenshot: screenshot,
    products: products,
  }
}

export default scraper

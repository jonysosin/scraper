/* eslint-disable @typescript-eslint/ban-ts-comment */
import { join } from 'path'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { extractBullets } from '../../providerHelpers/parseHtmlTextContent'
import { extractMetaTags } from '../../utils/extractors'
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import CharlotteModel from './model'

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)
  const url = request.pageUrl.split('/').slice(0, -1)

  await page.waitForFunction(`next.router.components['/[store]/product/[slug]']`)

  const model: CharlotteModel = await page.evaluate(
    // @ts-ignore
    () => next.router.components['/[store]/product/[slug]'].props.initialState.page.model,
  )

  const metaTags = await extractMetaTags(page)

  // @TODO: Add variant discovery
  const products = [model.product].map(sibling => {
    const product = new Product(
      sibling.id,
      sibling.title,
      join(...url, sibling.href)
        .replace('https:/', 'https://')
        .replace('http:/', 'http://'),
    )
    product.availability = sibling.availability === 'AVAILABLE'
    product.subTitle = sibling.subtitle
    product.color = sibling.subtitle
    product.colorFamily = sibling.id
    product.brand = 'Charlotte Tilbury'
    product.description = sibling.description
    product.realPrice = sibling.price.purchasePrice.value
    product.higherPrice = sibling.price.listingPrice.value
    product.currency = sibling.price.purchasePrice.currencyCode
    product.matchableIds = [sibling.id]
    product.sku = sibling.sku
    product.size = ''

    product.addAdditionalSection({
      name: 'Description',
      content: `<p class="SellBlock__description">${product.description}</p>`,
      description_placement: DESCRIPTION_PLACEMENT.MAIN,
    })

    if (model.product.longDescription)
      product.addAdditionalSection({
        name: 'Information',
        content: model.product.longDescription,
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
      })

    if (model.product.additionalDescription)
      product.addAdditionalSection({
        name: 'Additional Description',
        content: model.product.additionalDescription,
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
      })

    if (model.product.ingredients)
      product.addAdditionalSection({
        name: 'Ingredients',
        content: model.product.ingredients,
        description_placement: DESCRIPTION_PLACEMENT.DISTANT,
      })

    product.bullets = [
      ...extractBullets(model.product.additionalDescription || ''),
      ...extractBullets(model.product.longDescription || ''),
    ]

    product.breadcrumbs = model.breadcrumbs.map(breadcrumb => breadcrumb.label)
    product.images = [
      ...new Set([...sibling.images.map(i => i.imageSrc)]),
    ].map(link => `https:${link}`)
    product.videos = [model.product.shortVideo?.videoSrc]
      .filter(v => !!v)
      .map(link => `https:${link}`)
    product.metadata = { model, metaTags }

    return product
  })

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

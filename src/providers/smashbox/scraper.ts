import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getLdJsonScripts } from '../../utils/extractors'
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { Response } from './types'
import _ from 'lodash'

const scraper: Scraper = async (request, page) => {
  // disable request headers because site does not work with them
  await page.setExtraHTTPHeaders({})
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

  const ldjson = (await getLdJsonScripts(page))[0]

  const responseData = response.data.products.items

  const bullets = await page.$$eval('#slot_2_spp_content .benefits-block__text-content', results =>
    results.map(a => (a as HTMLElement).innerText).flatMap(x => x.split('\n')),
  )

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
        const fixedImages = await page.$$eval('.js-carousel-products img.elc-img', imgs =>
          imgs
            .slice(2)
            .map(img => img.getAttribute('src'))
            .map(img => `https://www.smashbox.com${img}`),
        )
        product.images = _.uniq(
          variant.media.large.map(x => `https://www.smashbox.com${x.src}`).concat(fixedImages),
        )
        product.videos = await page.$$eval('elc-video-js', videos => {
          return videos.flatMap(video => {
            const att = JSON.parse(video.getAttribute('data-setup')!)
            return att.sources.map(a => a.src)
          })
        })
        product.sku = variant.sku_id
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
        product.bullets = bullets

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

        const howtouse = await page.evaluate(() => {
          const match = document.querySelector('#slot_3_spp_content')
          return match ? match.outerHTML : null
        })

        if (howtouse) {
          product.addAdditionalSection({
            content: await howtouse,
            description_placement: DESCRIPTION_PLACEMENT.DISTANT,
            name: 'HOW TO USE',
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

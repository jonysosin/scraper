// @ts-nochec
import parseUrl from 'parse-url'
import Product from '../../entities/product'
import { IDescriptionSection, DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
// import { stringify } from 'querystring'
// import { TProviderData } from './types'
// import axios from 'axios'

const scraper: IScraper = async (request, page) => {

  const { protocol, resource } = parseUrl(request.pageUrl)

  // Website screenshot
  await page.goto(request.pageUrl)
  const screenshot = await screenPage(page)

  // Additional sections
  const additionalSections = await page.evaluate((DESCRIPTION_PLACEMENT) => {
    const sections: IDescriptionSection[] = []
    document.querySelectorAll('.product-info-sections > div').forEach((element) => {
      const name = element.querySelector('h3')?.textContent?.replace(/\n/g, "").trim() || ''
      const content = (element?.outerHTML || '').replace(/\n/g, "").replace(/\t/g, "").replace(/[\t ]+\</g, "<").replace(/\>[\t ]+\</g, "><").replace(/\>[\t ]+$/g, ">").trim()
      const placement = name === 'Product Details' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT
      sections.push({ name, content, description_placement: placement })
    })
    return sections
  }, DESCRIPTION_PLACEMENT)

  // Products / Variants
  const colorUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ul.variants__list--color li a')).map(e => e.getAttribute('href')) as string[]
  })

  const products: Product[] = []
  for (const colorUrl of colorUrls) {
    await page.goto(colorUrl)

    // @ts-ignore
    const data = await page.evaluate(() => window.utag_data)
    console.log(data)
    const description = await page.evaluate(() => {
      return document.querySelector('div.product-info-section-inner-wrap > div')?.textContent?.replaceAll('\t', '').replaceAll('\n', '').trim() ?? ''
    })

    const keyValuPairs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-specs__section .product-specs__attribute'))
        .reduce((specs: { [key: string]: string }, e) => {
          const key = e.querySelector('.product-specs__key')?.textContent?.trim()
          const value = e.querySelector('.product-specs__value')?.textContent?.trim()
          if (key && value) {
            specs[key] = value
          }
          return specs
        }, {})
    })

    const bullets: string[] = []
    bullets.push(...(await page.evaluate(() => {
      return Array
        .from(document.querySelectorAll('ul.pdp-pronation__flexParent__child-details li'))
        .map(e => {
          return `${e.querySelector('h3')?.textContent}: ${e.querySelector('div')?.textContent}`
        }) as string[]
    })))
    bullets.push(...(await page.evaluate(() => {
      return Array
        .from(document.querySelectorAll('.product-features-section ul li'))
        .map(e => {
          return `${e?.childNodes[0]?.textContent?.replaceAll('\t', '').replaceAll('\n', '').trim()}: ${e?.childNodes[1]?.nodeValue?.replaceAll('\t', '').replaceAll('\n', '').trim()}`
        }) as string[]
    })))


    const images = await page.evaluate(() => {
      return Array.from(new Set(Array.from(
        document.querySelectorAll('ul.product-primary-image li img.primary-image'))
        .map(e => e.getAttribute('data-src') ?? e.getAttribute('src'))
      )) as string[]
    })

    // Size chart
    const sizeChartUrl = await page.evaluate(() => {
      return document.querySelector('.variants__inline-link')?.getAttribute('href')
    })
    await page.goto(`${protocol}://${resource}${sizeChartUrl}`)
    const sizeChartHtml = await getSelectorOuterHtml(page, 'div.size-chart')

    data.product_sizes.forEach((size: string, i: number) => {
      const id = `${data.product_id[0]}-size:${size}`
      const title = data['meta.og:title']
      const productUrl = `${colorUrl}?size=${size}`

      const product = new Product(id, title, productUrl)

      product.itemGroupId = data.product_id[0]
      product.sku = id // TODO: find real sku
      product.brand = data.brand
      product.images = images
      product.size = size
      product.color = data.product_variant[0]
      product.realPrice = parseFloat(data.product_unit_price[0])
      product.higherPrice = parseFloat(data.product_unit_original_price[0])
      product.currency = data.currency
      product.availability = data.product_sizes_stock[i] === 'yes'
      product.description = description
      product.keyValuePairs = keyValuPairs
      product.bullets = bullets
      product.breadcrumbs = data._ccat[0].split('/')
      product.sizeChartHtml = sizeChartHtml
      product.addAdditionalSections(additionalSections)

      products.push(product)
    })
  }

  return { screenshot, products }
}

export default scraper

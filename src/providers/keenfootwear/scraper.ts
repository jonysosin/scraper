import type { Page } from 'puppeteer'
import Product from '../../entities/product'
import { DESCRIPTION_PLACEMENT } from 'src/interfaces/outputProduct'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { extractMetaTags, mergeMetaTags } from '../../utils/extractors'

const scraper: IScraper = async (request, page) => {

  // Website screenshot
  await page.goto(request.pageUrl)
  const screenshot = await screenPage(page)

  // Products / Variants
  const products: Product[] = []

  const colorUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ul.options.swatches.color li a')).map(e => e.getAttribute('href')) as string[]
  })
  for (const colorUrl of colorUrls) {
    await page.goto(colorUrl)
    const sizeUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div.size-selector ul.options li input')).map(e => e.getAttribute('value')) as string[]
    })
    if (sizeUrls?.length > 1) {
      for (const sizeUrl of sizeUrls) {
        await page.goto(sizeUrl)
        const widthUrls = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('div.width label.size-swatch input')).map(e => e.getAttribute('value')) as string[]
        })
        if (widthUrls.length) {
          for (const widthUrl of widthUrls) {
            products.push(await getProduct(page, widthUrl))
          }
        } else {
          products.push(await getProduct(page, sizeUrl))
        }
      }
    } else {
      products.push(await getProduct(page, colorUrl))
    }
  }

  return { screenshot, products }
}

async function getProduct(page: Page, productUrl: string) {
  await page.goto(productUrl)
  console.log(productUrl)

  const id = await page.evaluate(() => document.querySelector('div.styleno-container')?.textContent?.split('#')[1]) || ''
  const title = await page.evaluate(() => document.querySelector('meta[property="og:title"]')?.getAttribute('content')) || ''
  const product = new Product(id, title, productUrl)
  const variantData = await page.evaluate(() => JSON.parse(document.querySelector('div.product-variations')?.getAttribute('data-attributes') || '{}'))
  const metaTags = mergeMetaTags(await extractMetaTags(page))

  const mainImage = await page.evaluate(() => document.querySelector('.primary-image.main-image-copy')?.getAttribute('src') || '')
  const otherImages = await page.evaluate(() => Array.from(document.querySelectorAll('.alt-image-row img')).map(e => e.getAttribute('data-src') || e.getAttribute('src') || ''))

  const specs = await page.evaluate(() => Array.from(document.querySelectorAll('div.feature-segment.feature-offset li')).map(e => ({
    key: e.querySelector('span.feature-name')?.textContent?.replace(':', '').trim() || '',
    value: e.querySelector('div .feature-value')?.childNodes[2]?.textContent?.trim() || ''
  })))

  const keyValuePairs = specs.reduce((acc: Record<string, string>, { key, value }) => {
    acc[key] = value
    return acc
  }, {})
  if (variantData.width?.displayValue) {
    keyValuePairs['width'] = variantData.width.displayValue
  }

  const oldPrice = await page.evaluate(() => document.querySelector('div.product-price div.price-sales span.sale.old-price')?.textContent) || ''
  const newPrice = await page.evaluate(() => document.querySelector('div.product-price div.price-sales span.price-standard.price')?.textContent) || ''
  const price = await page.evaluate(() => document.querySelector('div.product-price div.price-sales')?.textContent) || ''

  product.itemGroupId = id?.split('-')[0]
  product.sku = id // TODO: find real sku
  product.brand = metaTags['og:site_name']
  product.images = [mainImage, ...otherImages]
  product.size = variantData.size.displayValue
  product.color = variantData.color.displayValue
  product.realPrice = parseFloat((newPrice || price).split('$')[1])
  product.higherPrice = parseFloat((oldPrice || price).split('$')[1])
  product.currency = 'USD'
  product.availability = !(await page.evaluate(() => document.querySelector('div.error div[itemprop="availabilty"]')))
  product.description = metaTags['og:description']
  product.keyValuePairs = keyValuePairs
  product.breadcrumbs = await page.evaluate(() => Array.from(document.querySelectorAll('div.breadcrumb a.breadcrumb-element')).map(e => e?.textContent || ''))
  product.metadata = { metaTags }
  product.sizeChartHtml = await page.evaluate(() => document.querySelector('div.size-chart')?.outerHTML.replaceAll('\n', '') || '')
  product.addAdditionalSection({
    name: await page.evaluate(() => document.querySelector('div.product-features--row div.section-header h3')?.textContent || ''),
    content: await page.evaluate(() => document.querySelector('div.product-features--row div.collapse--body')?.outerHTML.replaceAll('\n', '') || ''),
    description_placement: DESCRIPTION_PLACEMENT.DISTANT
  })

  return product
}

export default scraper

import type { Page } from 'puppeteer'
import Product from '../../entities/product'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { extractMetaTags, mergeMetaTags } from '../../utils/extractors'
import { autoScroll } from '../../providerHelpers/autoScroll'

const scraper: IScraper = async (request, page) => {
  // Website screenshot
  await page.goto(request.pageUrl)
  const screenshot = await screenPage(page)

  // Products / Variants
  const products: Product[] = []

  const variantSelectors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.variation-swatch ul li a')).map(el => {
      let path: string[] = []
      let parent
      while ((parent = el.parentNode)) {
        // @ts-ignore
        path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el) + 1})`)
        el = parent
      }
      return `${path.join(' > ')}`.toLowerCase()
    })
  })

  if (variantSelectors.length) {
    for (const variantSelector of variantSelectors) {
      await page.click(variantSelector)
      await autoScroll(page)
      await page.waitForTimeout(3000)

      products.push(await getProduct(page, request.pageUrl))
    }
  } else {
    await autoScroll(page)
    await page.waitForTimeout(3000)

    products.push(await getProduct(page, request.pageUrl))
  }

  return { screenshot, products }
}

async function getProduct(page: Page, productUrl: string) {
  const metaTags = mergeMetaTags(await extractMetaTags(page))
  const id = await page.$eval('div#pdpMain', e => e.getAttribute('tealium-product-master-id') || '')
  const title = await page.$eval(
    'h1.product-name',
    e => e.textContent?.replaceAll('\n', '').trim() || '',
  )

  const variantData = await page.$eval('div.product-variations', e =>
    JSON.parse(e.getAttribute('data-attributes') || '{}'),
  )
  let variantId = id
  // @ts-ignore
  for (const [key, { value }] of Object.entries(variantData)) {
    variantId += `-${key}:${value.replaceAll(' ', '+')}`
  }

  const product = new Product(variantId, title, productUrl)

  const images = await page.$$eval('.product-thumbnails img', imgs =>
    imgs.map(img => img?.getAttribute('src')?.replace('//', '') || ''),
  )

  const video = await page.evaluate(() =>
    document.querySelector('.video-container iframe')?.getAttribute('src')?.replace('//', ''),
  )

  const [sizeKey, sizeValue] = await page.$eval(
    '.size-label .text-copy',
    e => e.textContent?.replaceAll('\n', '').trim().split(':') || '',
  )
  const keyValuePairs = {
    [sizeKey]: sizeValue,
  }

  const additionSections = await page.evaluate(
    DESCRIPTION_PLACEMENT =>
      Array.from(document.querySelectorAll('.tab-pane')).map(tab => {
        const name = tab.getAttribute('id')?.split('-')[1].toUpperCase() || ''
        const content =
          tab
            .querySelector('.product-tab-content')
            ?.outerHTML.replaceAll('\n', '')
            .replaceAll('\t', '')
            .trim() || ''
        const description_placement =
          name === 'DETAILS' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT
        return { name, content, description_placement }
      }),
    DESCRIPTION_PLACEMENT,
  )

  const bullets = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tab-pane p'))
      .filter(
        p => p?.textContent?.trim().charAt(0) === '•' || p?.textContent?.trim().charAt(0) === '-',
      )
      .map(p => p.textContent?.replaceAll('\n', '').replaceAll('\t', '').trim() || ''),
  )

  bullets.push(
    ...(await page.evaluate(() =>
      Array.from(document.querySelectorAll('#tab-benefits.tab-pane ul li')).map(
        e => e.textContent?.replaceAll('\t', '') || '',
      ),
    )),
  )

  const price = parseFloat(metaTags['og:price:amount'].split(' ')[1])
  let higherPrice = price
  let realPrice = price

  const higherPriceString = await page.evaluate(
    () =>
      document
        .querySelector('.product-price .price-text .price-standard')
        ?.textContent?.split('$')[1],
  )

  if (higherPriceString) {
    higherPrice = parseFloat(higherPriceString)
  }

  product.subTitle = await page.$eval('p.sub-header', e => e.textContent || '')
  product.sku = variantId // TODO: find real sku
  product.brand = metaTags['og:site_name']
  product.images = images
  if (video) {
    product.videos = [video]
  }
  product.size = sizeValue
  if (variantData?.SkinShade?.displayValue) {
    product.color = variantData.SkinShade.displayValue
  }
  product.realPrice = realPrice
  product.higherPrice = higherPrice
  product.currency = metaTags['og:price:currency']
  product.availability = metaTags['og:availability'].toUpperCase() === 'IN_STOCK'
  product.description = await page.$eval('.short-description', e =>
    e?.childNodes[0]?.textContent?.replaceAll('\n', ''),
  )
  product.bullets = bullets
  product.keyValuePairs = keyValuePairs
  product.breadcrumbs = await page.$$eval('div.breadcrumb .breadcrumb-element', elements =>
    elements.map(e => e.textContent || ''),
  )
  product.metadata = { metaTags }
  product.addAdditionalSections(additionSections)

  return product
}

export default scraper

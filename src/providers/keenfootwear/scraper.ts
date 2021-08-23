import type { Page } from 'puppeteer'
import Product from '../../entities/product'
import { DESCRIPTION_PLACEMENT, IDescriptionSection } from '../../interfaces/outputProduct'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { extractMetaTags, mergeMetaTags } from '../../utils/extractors'

const scraper: IScraper = async (request, page) => {
  // Website screenshot
  await page.goto(request.pageUrl)
  const screenshot = await screenPage(page)

  // Products / Variants
  const products: Product[] = []

  const colorOptions = await findColors(page)
  for (const colorOption of colorOptions) {
    await pickColor(colorOption, page)

    const widthOptions = await findWidths(page)
    if (widthOptions.length > 0) {
      for (const widthOption of widthOptions) {
        await pickWidth(widthOption, page)

        const sizeButtonOptions = await findSizes(page)
        if (sizeButtonOptions?.length > 1) {
          for (const sizeButtonOption of sizeButtonOptions) {
            await pickSize(sizeButtonOption, page)
            products.push(await getProduct(page))
          }
        } else {
          products.push(await getProduct(page))
        }
      }
    } else {
      products.push(await getProduct(page))
    }
  }

  return { screenshot, products }
}

async function findWidths(page: Page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.width label.size-swatch input')).map(
      (e, idx) => idx + 1,
    )
  })
}

async function findSizes(page: Page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.size-selector ul.options li input')).map(
      (e, idx) => idx + 1,
    )
  })
}

async function findColors(page: Page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ul.options.swatches.color li a')).map(
      (e, idx) => idx + 1,
    )
  })
}

async function pickWidth(widthOption: number, page: Page) {
  const widthSelector = `div.width label.size-swatch:nth-child(${1 + widthOption}) input`
  await page.evaluate(
    widthSelector => document.querySelector(widthSelector)!.click(),
    widthSelector,
  )
  await page.waitForFunction(
    widthSelector => {
      const node = document.querySelector(widthSelector)!
      return node.getAttribute('checked') === 'checked'
    },
    {},
    widthSelector,
  )
}

async function pickSize(sizeButtonOption: number, page: Page) {
  const sizeSelector = `div.size-selector ul.options li:nth-child(${sizeButtonOption}) input`
  await page.evaluate(sizeSelector => document.querySelector(sizeSelector)!.click(), sizeSelector)
  await page.waitForFunction(
    sizeSelector => {
      const node = document.querySelector(sizeSelector)!
      return node.parentElement.classList.contains('is-active')
    },
    {},
    sizeSelector,
  )
}

async function pickColor(colorOption: number, page: Page) {
  const colorSelector = `ul.options.swatches.color li:nth-child(${colorOption}) a`
  await page.evaluate(
    colorSelector => document.querySelector(colorSelector)!.click(),
    colorSelector,
  )
  await page.waitForFunction(
    colorSelector => {
      const node = document.querySelector(colorSelector)!
      return node.parentElement.classList.contains('is-active')
    },
    {},
    colorSelector,
  )
}

async function getProduct(page: Page) {
  const id =
    (await page.evaluate(
      () => document.querySelector('div.styleno-container')?.textContent?.split('#')[1],
    )) || ''
  const title =
    (await page.evaluate(() =>
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    )) || ''
  const url = await page.$eval('.size-swatch.is-active input', e => e.getAttribute('value')!)

  const product = new Product(id, title, url)
  const variantData = await page.evaluate(() =>
    JSON.parse(
      document.querySelector('div.product-variations')?.getAttribute('data-attributes') || '{}',
    ),
  )
  const metaTags = mergeMetaTags(await extractMetaTags(page))

  const mainImage = await page.evaluate(
    () => document.querySelector('.primary-image.main-image-copy')?.getAttribute('src') || '',
  )
  const otherImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.alt-image-row img')).map(
      e => e.getAttribute('data-src') || e.getAttribute('src') || '',
    ),
  )

  const bullets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ul.feature-body li div.feature-value')).map(
      e => e.textContent?.replaceAll('\n', '').trim() || '',
    )
  })
  bullets.push(
    ...(await page.evaluate(() => {
      const bullets: string[] = []
      Array.from(document.querySelectorAll('.description-drawer--bodycopy p')).forEach(e => {
        const key = e.childNodes[1]?.textContent?.replaceAll('\n', '').trim() || ''
        const value = e.childNodes[2]?.textContent?.replaceAll('\n', '').trim() || ''
        if (key && value) {
          bullets.push(`${key}: ${value}`)
        }
      })
      return bullets
    })),
  )

  const additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
    return Array.from(document.querySelectorAll('div.product-features--row')).map(e => {
      const name = e.querySelector('div.section-header h3')?.textContent || ''
      const content =
        e
          .querySelector('div.product-features--row div.collapse--body')
          ?.outerHTML.replaceAll('\n', '') || ''
      const description_placement =
        name === 'Description' ? DESCRIPTION_PLACEMENT.MAIN : DESCRIPTION_PLACEMENT.ADJACENT
      return { name, content, description_placement }
    })
  }, DESCRIPTION_PLACEMENT)

  const specs = await page.evaluate(() => {
    const specs: Record<string, string>[] = []
    Array.from(document.querySelectorAll('div.feature-segment li')).forEach(e => {
      const key = e.querySelector('span.feature-name')?.textContent?.replace(':', '').trim() || ''
      const value = e.querySelector('div .feature-value')?.childNodes[2]?.textContent?.trim() || ''
      if (key && value) {
        specs.push({ key, value })
      }
    })
    return specs
  })
  const keyValuePairs = specs.reduce((acc: Record<string, string>, { key, value }) => {
    acc[key] = value
    return acc
  }, {})
  if (variantData.width?.displayValue) {
    keyValuePairs['width'] = variantData.width.displayValue
  }

  const salePrice = await page
    .$eval('.product-detail-hero--product-info .old-price:not(:empty)', e =>
      (e as HTMLElement).innerText.replace(/[\n\r]/gm, '').replace('$', ''),
    )
    .catch(() => null)

  const saleNormalPrice = await page
    .$eval('.product-detail-hero--product-info .old-price:not(:empty)~.price', e =>
      (e as HTMLElement).innerText.replace(/[\n\r]*/gm, '').replace('$', ''),
    )
    .catch(() => null)

  const normalPrice = await page.$eval(
    '.product-detail-hero .product-content-container .product-price .price-sales.price',
    e => (e as HTMLElement).innerText.replace(/[\n\r]*/gm, '').replace('$', ''),
  )

  // This price code looks over complicated, but it need to be like these to deal with a weird bug, ask Matias Pierobon for more info

  const realPrice = salePrice ? Number(salePrice) : Number(normalPrice)
  const higherPrice = salePrice ? Number(saleNormalPrice) : undefined

  product.itemGroupId = id?.split('-')[0]
  product.sku = id // TODO: find real sku
  product.brand = metaTags['og:site_name']
  product.images = [mainImage, ...otherImages]
  product.size = variantData.size.displayValue
  product.color = variantData.color.displayValue
  product.realPrice = realPrice
  product.higherPrice = higherPrice
  product.currency = 'USD'
  product.availability = !(await page.evaluate(() =>
    document.querySelector('div.error div[itemprop="availability"]'),
  ))
  product.description = metaTags['og:description']
  product.keyValuePairs = keyValuePairs
  product.bullets = bullets
  product.breadcrumbs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div.breadcrumb .breadcrumb-element')).map(
      e => e?.textContent || '',
    ),
  )
  product.metadata = { metaTags }
  product.sizeChartHtml = await page.evaluate(
    () => document.querySelector('div.size-chart')?.outerHTML.replaceAll('\n', '') || '',
  )
  product.addAdditionalSections(additionalSections)

  return product
}

export default scraper

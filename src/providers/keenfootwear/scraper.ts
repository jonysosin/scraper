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

  const colorUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('ul.options.swatches.color li a')).map(e =>
      e.getAttribute('href'),
    ) as string[]
  })
  for (const colorUrl of colorUrls) {
    await page.goto(colorUrl)
    const sizeUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div.size-selector ul.options li input')).map(e =>
        e.getAttribute('value'),
      ) as string[]
    })
    if (sizeUrls?.length > 1) {
      for (const sizeUrl of sizeUrls) {
        await page.goto(sizeUrl)
        const widthUrls = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('div.width label.size-swatch input')).map(e =>
            e.getAttribute('value'),
          ) as string[]
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

  const id =
    (await page.evaluate(
      () => document.querySelector('div.styleno-container')?.textContent?.split('#')[1],
    )) || ''
  const title =
    (await page.evaluate(() =>
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    )) || ''
  const product = new Product(id, title, productUrl)
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

  const oldPrice = await page.evaluate(
    () =>
      document
        .querySelector('div.product-price div.price-sales span.sale.old-price')
        ?.textContent?.split('$')[1],
  )
  const newPrice = await page.evaluate(
    () =>
      document
        .querySelector('div.product-price div.price-sales span.price-standard.price')
        ?.textContent?.split('$')[1],
  )
  const price = await page.evaluate(
    () => document.querySelector('div.product-price div.price-sales')?.textContent?.split('$')[1],
  )

  // This price code looks over complicated, but it need to be like these to deal with a weird bug, ask Mathias Efron for more info
  const oldPriceNumber = oldPrice && parseFloat(oldPrice)
  const newPriceNumber = newPrice && parseFloat(newPrice)
  const priceNumber = price && parseFloat(price)
  let realPrice
  let higherPrice

  if (priceNumber && !oldPriceNumber && !newPriceNumber) {
    // no sale - no bug
    realPrice = priceNumber
    higherPrice = priceNumber
  } else if (priceNumber && oldPriceNumber && newPriceNumber && priceNumber === oldPriceNumber) {
    // sale
    realPrice = newPriceNumber
    higherPrice = oldPriceNumber
  } else if (priceNumber && oldPriceNumber && newPriceNumber && priceNumber !== oldPriceNumber) {
    // no sale - bug
    realPrice = priceNumber
    higherPrice = priceNumber
  }

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

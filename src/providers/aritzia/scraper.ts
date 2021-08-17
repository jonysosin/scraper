import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)

  const gaa = await page.evaluate(() => gaa)

  const collections = await page.$$eval('.swatches-collection li', collections =>
    collections.map((collection: any) => ({
      key: collection?.dataset.collection,
      // some out-of-stock colors aren't shown in the picker but we list them anyways.
      colors: collection?.dataset.colors.split('|').filter(s => s),
    })),
  )

  const sizes = await page.$$eval('.swatches-size li a', sizes =>
    sizes.map((size: any) => size.href.split('_size=')[1].split('&')[0]),
  )

  const sizesTitles = await page.$$eval('.swatches-size li a', sizes =>
    sizes.map((size: any) => size.title)
  )

  const breadcrumbs = await page.$$eval('.ar-category-breadcrumbs ul li', items =>
    items.map((e: any) => e.textContent?.split('—')[0]?.trim() || '').filter(s => s),
  )

  // sections

  // sizeChart
  await page.click('.js-size-chart-link')
  await page.waitForSelector('.js-sizeguide__swatch-size[title="L"]')
  const allsizesChartsHTML = {}
  for(const title of sizesTitles) {
    await page.click(`.js-sizeguide__swatch-size[title="${title}"]`)
    await page.waitForSelector('.js-sizeguide__measurements')
    // @ts-ignore
    allsizesChartsHTML[title] = (await page.$eval('.js-sizeguide__measurements', el => el.innerHTML))
  }

  const variantsURLs = []

  if (!collections.length) {
    // no collections
    const colors = await page.$$eval('.swatch-strike a', colors =>
      colors.map((color: any) => color.href.split('_color=')[1].split('&')[0]),
    )

    for (const color of colors) {
      for (const size of sizes) {
        const id = gaa.product.id
        variantsURLs.push({
          // @ts-ignore
          imagesURL: `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/Product-GetProductImages?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&format=ajax`,
          // @ts-ignore
          detailsURL: `https://www.aritzia.com/intl/en/product/variation?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&format=ajax`,
        })
      }
    }
  } else {
    for (const { key, colors } of collections) {
      for (const color of colors) {
        for (const size of sizes) {
          const id = gaa.product.id
          variantsURLs.push({
            // @ts-ignore
            imagesURL: `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/Product-GetProductImages?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&dwvar_${id}_collection=${key}&format=ajax`,
            // @ts-ignore
            detailsURL: `https://www.aritzia.com/intl/en/product/variation?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&dwvar_${id}_collection=${key}&format=ajax`,
          })
        }
      }
    }
  }

  const products: Product[] = []

  let counter = variantsURLs.length

  for (const { detailsURL, imagesURL } of variantsURLs) {
    console.log(--counter)

    await page.goto(detailsURL, { waitUntil: 'domcontentloaded' })

    // re-run script with details
    await page.evaluate(() => {
      //@ts-ignore
      window.gaa = {}
      //@ts-ignore
      eval(document.querySelector('script').innerHTML)
    })

    const data = await page.evaluate(() => gaa.product)
    const subTitle = await page.$eval(
      '.pdp-product-name__subtitle',
      e => e.textContent?.trim() || '',
    )
    const description = await page.$eval(
      '.js-product-accordion__content.f0',
      e => e.textContent?.trim() || '',
    )

    const bullets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.js-product-accordion ul')[0].querySelectorAll('li'))
        .map(i => i.textContent?.trim() || '')
        .filter(s => s),
    )

    const keyValuePairs = await page.evaluate(() =>
      Object.fromEntries(
        Array.from(document.querySelectorAll('.js-product-accordion ul')[1].querySelectorAll('li'))
          .map((i: any) => i.textContent.split(';').map(i => i.trim().split(':')))
          .flat(),
      ),
    )

    await page.goto(imagesURL, { waitUntil: 'domcontentloaded' })

    const images = await page.$$eval('img[data-original]', images =>
      images.map((img: any) => img.dataset?.original || '').filter(s => s),
    )

    const variant = new Product(
      data.variant,
      data.name,
      // @ts-ignore
      detailsURL.replace('&format=ajax', ''),
    )

    const options = {
      size: data.size,
      color: data.color,
      collection: page.url()?.split('_collection=')[1]?.split('&')[0] ?? undefined,
    }

    variant.subTitle = subTitle
    variant.description = description
    variant.brand = data.brand
    variant.currency = data.currency
    variant.realPrice = data.price
    variant.higherPrice = data.listPrice || data.price
    variant.sku = data.variant
    variant.itemGroupId = data.id
    variant.color = data.color
    variant.size = data.size
    variant.breadcrumbs = breadcrumbs
    variant.bullets = bullets
    variant.keyValuePairs = keyValuePairs
    variant.availability = data.availability.toLowerCase() !== 'not available'
    variant.images = images
    variant.options = options
    variant.sizeChartHtml = allsizesChartsHTML[data.size]

    products.push(variant)
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

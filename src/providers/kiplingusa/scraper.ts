import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { extractMetaTags, mergeMetaTags } from '../../utils/extractors'
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl, { timeout: 120000 })

  const shouldCloseAnnoyingModal = await page.evaluate(async () => {
    const node = document.querySelector('#popup-start')
    return node && window.getComputedStyle(node).getPropertyValue('display') !== 'none'
  })
  if (shouldCloseAnnoyingModal) {
    await page.click('#popup-start .close-button')
  }

  const screenshot = await screenPage(page)

  const metaTags = mergeMetaTags(await extractMetaTags(page))

  const colorOptions = await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('.swatches.Color li > a'))

    return lis.map(li => ({
      url: li.getAttribute('href')!,
      title: li.getAttribute('title'),
      subtitle: li.getAttribute('data-event-action'),
      productId: li.getAttribute('data-masterid'),
      colorId: li.getAttribute('data-colorid'),
      // @ts-ignore
      color: li.innerText,
    }))
  })

  const products: Product[] = []

  for (const colorOption of colorOptions) {
    const { url, title, color, colorId } = colorOption

    const shouldClick = await page.evaluate(selection => {
      const node = document.querySelector('.product-variations .selected-value')!
      // @ts-ignore
      if (node && node.innerText === selection) return false
      return true
    }, title!)

    if (shouldClick) {
      await page.click(`a[data-colorid="${colorId}"]`)
      await page.waitForFunction(
        selection => {
          const node = document.querySelector('.product-variations .selected-value')!
          if (!node) return false
          // @ts-ignore
          return node.innerText === selection
        },
        {},
        title!,
      )
    }

    const id = await page.$eval(
      '.product-add-to-cart input[name="pid"]',
      x => x.getAttribute('value')!,
    )
    const groupId = await page.$eval(
      '.product-add-to-cart input[name="pid_master"]',
      x => x.getAttribute('value')!,
    )
    const theTitle = await page.$eval('.pdp-name-wrapper', e => e.textContent!)
    const brand = await page.$eval('.pdp-brand-wrapper', e => e.textContent!)

    const product = new Product(id, theTitle, url)

    await page.waitForSelector('.zoomImg')
    product.images = await page.$$eval('.zoomImg', imgs =>
      imgs.map(img => img.getAttribute('src')!),
    )

    product.description = await page.$eval('.pdp-description-wrapper', e => e.textContent!.trim())
    product.currency = metaTags['product:price:currency']
    product.sku = id
    product.realPrice = parseInt(
      await page.$eval('span[itemprop="price"]', x => x.getAttribute('content')!),
    )
    product.brand = brand

    const higherPrice = await page.evaluate(() => {
      const node = document.querySelector('.product-price > .price-standard')
      return node ? node.textContent?.replace('$', '') : null
    })
    if (higherPrice) {
      product.higherPrice = parseInt(higherPrice)
    }
    product.availability = metaTags['og:availability'] === 'instock'
    product.itemGroupId = groupId
    product.color = color!
    // @ts-ignore
    product.breadcrumbs = await page.$eval('.breadcrumb', x => x.innerText.split('\n'))
    product.bullets = await page.$eval('.bulletedList', list =>
      // @ts-ignore
      list.innerText.split('\n').map(x => x.trim()),
    )

    product.addAdditionalSection({
      content: await page.$eval(
        '.product-description-wrapper > .product-info-accordion > div:nth-child(1)',
        e => e.outerHTML,
      ),
      description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
      name: 'FEATURES',
    })

    const hasAdditionalFeatures = await page.evaluate(() => {
      return !!document.querySelector(
        '.product-description-wrapper > .product-info-accordion > div:nth-child(2)',
      )
    })
    if (hasAdditionalFeatures) {
      product.addAdditionalSection({
        content: await page.$eval(
          '.product-description-wrapper > .product-info-accordion > div:nth-child(2)',
          e => e.outerHTML,
        ),
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        name: 'FEATURES',
      })
    }

    products.push(product)
  }
  return {
    screenshot,
    products,
  }
}

export default scraper

import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { finished } from 'stream'

const promiseGen = () => {
  let resolve
  let promise = new Promise(r => (resolve = r))
  setTimeout(resolve, 4 * 60000) // 4min fallback
  return [promise, resolve]
}

function IsJsonString(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

const scraper: Scraper = async (request, page) => {
  await page.setRequestInterception(true)

  let variants = [] as any

  let [waitForSelectors, selectorsCompleted] = promiseGen()
  let [waitForVariants, variantsCompleted] = promiseGen()

  let itemGroupId

  page.on('request', request => request.continue())

  page.on('response', async response => {
    // 2: hook carousel info for variants SKUs
    if (response.url().includes('/carousel?catalogId=')) {
      itemGroupId = response.url().split(/catalogId=|&/)[1]

      let allSKUs = []
      let { colors } = await response.json()

      for (let { details } of colors.carousel) {
        allSKUs = allSKUs.concat(JSON.parse(details.allSkus))
      }

      await waitForSelectors

      for (let sku of allSKUs) {
        let url = `https://www.ray-ban.com/usa/eyeglasses//ProductStylesJSONView?langId=-1&storeId=10151&catEntries=${sku}`
        const response = await page.goto(url)

        let variant: any = Object.entries(await response.json())[0][1]
        variant.manifestImages = []
        variants.push(variant)
      }

      variantsCompleted()
    }
  })

  await page.goto(request.pageUrl)

  // 1: description from selector
  let description, breadcrumbs, detailsTable, lensColor
  try {
    await page.waitForSelector('.rb-pdp-editorial', { timeout: 15000 })

    breadcrumbs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.rb-pdp-left-breadcrumb li')).map(e => e.textContent),
    )

    description = await page.$eval(
      '.rb-pdp-editorial__description',
      e => e.textContent?.trim() || '',
    )

    detailsTable = await page.$eval('.rb-grid', e => e.innerHTML)

    lensColor = await page.evaluate(
      () =>
        document
          .querySelector('.rb-pdp-editorial__details')
          ?.textContent?.split('  Color')[1]
          ?.trim()
          ?.split('  ')[0]
          .trim() || '',
    )
  } catch (e) {}

  selectorsCompleted()
  await waitForVariants

  for (let variant of variants) {
    let url = `https://images.ray-ban.com/is/image/RayBan/${variant.partNumber}_manifest_2.json`
    const response = await page.goto(url)

    let { items } = await response.json()
    variant.manifestImages = items.map(
      img => `https://images.ray-ban.com/is/image/RayBan/${variant.partNumber}_${img.file_key}.png`,
    )
  }

  const products = variants.map((v: any) => {
    let url = new URL(request.pageUrl).hostname + v.linkDetailsView
    let p = new Product(v.catentryId, v.modelName, url)

    p.images = ['https:' + v.imageUrl, ...v.manifestImages]
    if (description) p.description = description
    p.currency = v.currency
    p.sku = v.displaySKU
    p.size = v.modelSizeDisplay
    p.realPrice = v.offerPrice
    p.higherPrice = v.listPrice
    p.availability = v.buyableqty > 0
    p.itemGroupId = itemGroupId
    p.color = [v.frameColor, lensColor].join(' ')
    p.options = { polarized: v.polarized }
    p.keyValuePairs = { frameMaterial: v.frameMaterial, lenses: v.lenses }
    p.breadcrumbs = breadcrumbs
    if (detailsTable) p.sizeChartHtml = detailsTable // height, width, length, shape

    return p
  })

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

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

const scraper: Scraper = async (request, page) => {
  await page.setRequestInterception(true)

  let variants = [] as any

  let [waitForSelectors, selectorsCompleted] = promiseGen()
  let [waitForVariants, variantsCompleted] = promiseGen()

  let itemGroupId, variantsCounter

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

      variantsCounter = allSKUs.length

      await waitForSelectors

      for (let sku of allSKUs) {
        let url = `https://www.ray-ban.com/usa/eyeglasses//ProductStylesJSONView?langId=-1&storeId=10151&catEntries=${sku}`
        await page.goto(url)
      }
    }
  })

  page.on('response', async response => {
    // 3: hook SKU details
    if (response.url().includes('//ProductStylesJSONView')) {
      console.log(await response.text())
      let variant: any = Object.entries(await response.json())[0][1]
      variant.manifestImages = []
      variants.push(variant)

      if (!--variantsCounter) variantsCompleted()
    }
  })

  await page.goto(request.pageUrl)

  // 1: description from selector
  let description, breadcrumbs, detailsTable, lensColor
  try {

    await page.waitForSelector('.rb-pdp-editorial', { timeout: 15000 })

    breadcrumbs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.rb-pdp-left-breadcrumb li')).map(e => e.textContent)
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

  let [waitForImages, imagesCompleted] = promiseGen()
  let manifestCounter = variants.length


  page.on('response', async response => {
    // 4: hook for image data
    if (response.url().includes('manifest_2.json')) {
      console.log('eeeeeee')
      console.log(variants)
      if (response.status() === 200) {
        let { items } = await response.json()
        let urlPartNumber = response.url().split(/RayBan.|_manifest/g)[1]

        let variant: any = variants.find((v: any) => v.partNumber == urlPartNumber)

        if (variant !== undefined) {
          variant.manifestImages = items.map(
            img =>
              `https://images.ray-ban.com/is/image/RayBan/${urlPartNumber}_${img.file_key}.png`,
          )
        }
      }
      if (!--manifestCounter) imagesCompleted()
    }
  })

  for (let { partNumber } of variants) {
    let url = `https://images.ray-ban.com/is/image/RayBan/${partNumber}_manifest_2.json`
    await page.goto(url)
  }

  await waitForImages

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

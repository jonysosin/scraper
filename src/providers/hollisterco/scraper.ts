import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: Scraper = async (request, page) => {
  page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36',
  )

  let itemGroupUrl = request.pageUrl
  let itemGroupId = request.pageUrl.split('?')[0].split('-').slice(-1)[0]

  await page.goto(request.pageUrl)

  const title = await page.$eval('.product-title-main-header', e => e.textContent?.trim() || '')
  const subtitle = await page.$eval('.short-description', e => e.textContent?.trim() || '')
  const currency = await page.$eval(
    '.open-currency-selection-modal span',
    e => e.textContent?.split(/\(|\)/g)[1] || '',
  )
  //@ts-ignore
  const breadcrumbs = await page.$eval('.breadcrumbs ol', e => e.innerText.split('\n') || '')

  const options = await page.evaluate(() => {

    let options = Array.prototype.map.call(
      document.querySelectorAll('select[name="sku"] option'),
      el => ({
        idx: el.value,
        ...Object.assign({}, el.dataset),
      }),
    )

    // if more than one option remove the first empty tag
    options = options.length === 1 ? options : options.slice(1)

    let swatch
    let onlyOneAvailable = false

    // @ts-ignore
    if (document.querySelector('.product-swatches li').length > 1) {
      swatch = Array.prototype.map.call(
        document.querySelectorAll('.product-swatches input'),
        el => ({
          ...Object.assign({}, el.dataset),
        }),
      )
    } else {
      // @ts-ignore
      onlyOneAvailable = options.find(o => o.inventoryStatus === 'Available').swatch
      swatch = [
        {
          // @ts-ignore
          productid: Object.keys(productCatalog)[0],
          swatch: onlyOneAvailable,
          producturl: null,
        },
      ]
    }

    swatch = swatch.map(sw => {
      //@ts-ignore
      const p = productCatalog[sw.productid]
      const kv = p.productAttrsComplex.FiberContent
      const keyValues = {}

      if (kv !== undefined) {
        // check for .value (str) or .values []
        if (kv.value) {
          let [key, value] = kv.value.split(':')
          keyValues[key] = value
        } else {
          //@ts-ignore
          for (let pairs of p.productAttrsComplex.FiberContent.values) {
            let [key, value] = pairs.value.split(':')
            keyValues[key] = value
          }
        }
      }

      let bullets = p.productAttrsComplex.CareInstructions?.values.map(o => o.value)
      bullets = Array.isArray(bullets) ? bullets : []

      const tmp = document.createElement("DIV");
      tmp.innerHTML = p.longDesc;

      const plainTextDescription = tmp.textContent || tmp.innerText || "";

      return {
        //@ts-ignore
        ...sw,
        sizeChartUrls: [
          `https://www.hollisterco.com/api/ecomm/h-wd/product/sizeguide/${p.sizeChartName}`,
        ],
        description: plainTextDescription,
        keyValuePairs: keyValues,
        bullets: bullets,
        //@ts-ignore
        images: Object.values(productCatalog[sw.productid].imageSets)
          .flat()
          //@ts-ignore
          .filter(o => o.id)
          //@ts-ignore
          .map(o => `https://img.hollisterco.com/is/image/anf/${o.id}?policy=product-large`),
      }
    })

    options = options
      .filter((op: any) => !onlyOneAvailable || op.swatch === onlyOneAvailable)
      .map((op: any) => ({
        ...op,
        ...swatch.find(s => s.swatch === op.swatch),
      }))

    options = options.map((op: any) => {
      //@ts-ignore
      let item: any = Object.values(productPrices[op.productid].items)[0]
      return {
        ...op,
        ...item,
      }
    })

    return options

  })

  const variants = options.map((op: any) => ({
    ...op,
    producturl:
      op.producturl === null ? itemGroupUrl : new URL(itemGroupUrl).hostname + op.producturl,
  }))

  // console.dir(variants, { depth: null })

  const products = variants.map((v: any) => {
    let p = new Product(`${v.idx}-${v.productid}`, title, v.producturl)

    p.subTitle = subtitle
    p.images = v.images
    p.videos = []
    p.description = v.description
    p.currency = currency
    p.sku = v.sku
    p.brand = v.brand
    p.size = v.sizePrimary + (v.sizeSecondary ? ` - ${v.sizeSecondary}` : '')
    p.realPrice = v.offerPrice || v.listPrice
    p.higherPrice = v.listPrice
    p.availability = v.inventoryStatus === 'Available'
    p.itemGroupId = itemGroupId
    p.color = v.swatchColorFamily
    p.colorFamily = v.swatch
    p.bullets = v.bullets
    p.keyValuePairs = v.keyValuePairs
    p.sizeChartUrls = v.sizeChartUrls

    return p
  })

  const screenshot = await screenPage(page)

  // the site fingerprints the browser with cookies on the first request
  const client = await page.target().createCDPSession()
  await client.send('Network.clearBrowserCookies')
  await client.send('Network.clearBrowserCache')

  return {
    screenshot,
    products,
  }
}

export default scraper

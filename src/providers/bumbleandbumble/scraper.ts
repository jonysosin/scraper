import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { Page } from 'puppeteer'
import { extractBullets, extractText } from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'

const baseUrl = 'https://www.bumbleandbumble.com'
const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)


  /**
   * Get product data
   */
  const products: Product[] = []
  const productData = await getProductJson(page)
  const baseProduct = await createBaseProduct(productData, page)
  if (productData.skus.length) {
    for (const variantData of productData.skus) {
      const variantProduct = await createProductVariant(baseProduct, productData, variantData)

      products.push(variantProduct)
    }
  } else {
    products.push(baseProduct)
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

const getProductJson = async (page: Page) => {
  await page.waitForFunction('window.prodcat')
  return page.evaluate(() => {
    // @ts-ignore
    return window.prodcat.data.getProduct(PRODUCT_ID)
  })
}

async function createProductVariant (product: Product, productData: any, variantData: any): Promise<Product> {
  const productVariant = product.clone()

  productVariant.id = variantData.SKU_BASE_ID
  productVariant.sku = variantData.SKU_BASE_ID
  productVariant.images = [...variantData.LARGE_IMAGE, ...productData.defaultSku.LARGE_ALT_IMAGES].map(url => baseUrl + url)
  productVariant.availability = !!variantData.rs_sku_availability

  if (variantData.PRODUCT_SIZE) {
    productVariant.size = variantData.PRODUCT_SIZE

    productVariant.options = { 'size': variantData.PRODUCT_SIZE }
  }

  const { realPrice, higherPrice } = getPrice(variantData)
  productVariant.higherPrice = higherPrice
  productVariant.realPrice = realPrice
  productVariant.url = `${product.url}#/sku/${productVariant.sku}`

  return productVariant
}

async function createBaseProduct(productData: any, page: Page): Promise<Product> {
  const baseProduct = new Product(productData.defaultSku.SKU_BASE_ID, productData.PROD_RGN_NAME, baseUrl + productData.url)

  baseProduct.subTitle = productData.SHORT_DESC
  baseProduct.subTitle = productData
  baseProduct.images = [...productData.LARGE_IMAGE, ...productData.defaultSku.LARGE_ALT_IMAGES].map(url => baseUrl + url)
  baseProduct.description = productData.DESCRIPTION
  baseProduct.currency = productData.rs_default_currency
  baseProduct.sku = productData.defaultSku.SKU_BASE_ID
  baseProduct.brand = "Bumble"
  baseProduct.availability = productData.defaultSku.rs_sku_availability
  baseProduct.itemGroupId = productData.PROD_BASE_ID

  // Size
  if (productData.defaultSku.PRODUCT_SIZE) {
    baseProduct.size = productData.defaultSku.PRODUCT_SIZE

    baseProduct.options = { 'size': productData.defaultSku.PRODUCT_SIZE }
  }

  // Video
  const videoElement = await page.$('[data-zentrick-id]')
  if (videoElement) {
    const videoId = await videoElement.evaluate(element => element.getAttribute('data-zentrick-id'))

    baseProduct.videos = [`http://watch.zentrick.com/${videoId}`]
  }

  // Prices
  const { realPrice, higherPrice } = getPrice(productData)
  baseProduct.higherPrice = higherPrice
  baseProduct.realPrice = realPrice

  // Breadcrumbs
  const breadcrumbs = await page.$$eval('.product-breadcrumb__link', (items: any) => items.map(i => i?.textContent))
  if (breadcrumbs.length) {
    baseProduct.breadcrumbs = breadcrumbs
  }

  // Additional Sections
  const additionalSections = await page.$$eval('.product-full__detail', (elements) => elements.reduce((prev: any, curr: any) => {
    const name = curr.querySelector('.product-full__detail-title')?.textContent
    if (name) {
      const section = { name, content: curr.innerHTML }

      prev.push(section)
    }

    return prev
  }, []))

  if (additionalSections.length) {
    baseProduct.additionalSections = additionalSections.map(section => ({ ...section, description_placement: DESCRIPTION_PLACEMENT.MAIN }))
  }

  // Bullets
  const items = Object.values(productData).filter(value => String(value).includes('&bull;'))
  let bullets: string[] = []
  if (items.length) {
    for (const item of items) {
      bullets = bullets.concat(String(item).split('&bull;').filter(b => String(b).startsWith(' ')))
    }
  }

  // Bullets
  if (bullets.length) {
    baseProduct.bullets = bullets.map(b => extractText(b))

    // Key Value Pairs
    const keyValuePairs = baseProduct.bullets.filter(b => b.includes(':')).reduce((prev, curr) => {
      const prop = curr.split(':')
      if (prop.length == 2) {
        prev[prop[0]] = String(prop[1]).trim()
      }

      return prev
    }, {})

    if (Object.keys(keyValuePairs)) {
      baseProduct.keyValuePairs = keyValuePairs
    }
  }

  return baseProduct
}

function getPrice (product: any): { higherPrice: number, realPrice: number } {
  let higherPrice
  let realPrice

  if (product.PRICE && product.PRICE2) {
    higherPrice = Math.max(product.PRICE, product.PRICE2)
    realPrice = Math.min(product.PRICE, product.PRICE2)
  } else {
    higherPrice = product.PRICE
    realPrice = product.PRICE
  }

  return { higherPrice, realPrice }
}
export default scraper

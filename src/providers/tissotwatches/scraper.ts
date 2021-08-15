import { DESCRIPTION_PLACEMENT, IDescriptionSection } from '../../interfaces/outputProduct';
import { Page } from 'puppeteer';
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { getBaseProductMetadata, getItemPropValue } from './helpers';

const scraper: Scraper = async (request, page) => {
  /**
   * Intercept Magento Widgets
   *
   * Why? Because Magento 2 render all the JSON configs for jQuery widgets for all the modules,
   * and when jQuery initialize them, the data is removed from the page, so intercepting the .js files
   * we can get all the data raw sent from the backend to the jQuery widgets (get product data from JSON instead checking the dom)
   */
  await page.setRequestInterception(true);
  page.on('request', (interceptedRequest) => {
    if (interceptedRequest.url().endsWith('.js')) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto(request.pageUrl, { waitUntil: 'domcontentloaded' })

  // Create Base Product
  const { productData, hasVariants, variantData } = await getBaseProductMetadata(page)
  const product = await createBaseProduct(productData, page)
  const products: Product[] = []

  if (hasVariants) {
    for (const variantItemData of variantData) {
      const productVariant = await createProductVariant(product.clone(), productData, variantItemData, page)
      products.push(productVariant)
    }
  } else {
    products.push(product)
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

async function createBaseProduct(productData: any, page: Page) {
  const product = new Product(productData.id, productData.name, productData.url)

  // Subtitle
  const subtitleElement = !!await page.$('.product-label')
  if (subtitleElement) {
    const subtitle = await page.$eval(('.product-label'), element => element.textContent)

    if (subtitle) {
      product.subTitle = subtitle
    }
  }

  // Images
  const images = await page.$$eval('.product-mosaic .product-mosaic__item img', elements => elements.map((img: any) => img && img.src))
  if (images && images.length) {
    product.images = images
  }


  const $videoElements = '.product-video iframe'
  const hasVideoElement = !!await page.$($videoElements)
  if (hasVideoElement) {
    const videos = await page.$$eval($videoElements, elements => elements.map(((i: any) => i && i.src)))
    if (videos && videos.length) {
      product.videos = videos
    }
  }

  // Description
  const description = await page.$eval('[itemprop="description"]', el => el.textContent)
  if (description) {
    product.description = description
  }

  // Additional Sections
  const additionalSections = await getAdditionalSections(page)
  if (additionalSections.length) {
    product.addAdditionalSections(additionalSections)
  }

  // Currency
  product.currency = productData.currency_code

  // SKU
  const sku = await getItemPropValue('data-product-sku', page)
  if (sku) {
    product.sku = sku
  }

  // Brand
  const brand = await getItemPropValue('itemprop="brand"', page)
  if (brand) {
    product.brand = brand
  }

  product.realPrice = productData.price_info.minimal_price
  product.higherPrice = productData.price_info.max_price

  product.itemGroupId = product.id

  // Availability
  const availability = await page.$eval('[itemprop="availability"]', element => element?.getAttribute('content'))
  product.availability = availability =='http://schema.org/InStock'

  const gender = await getGender(page)
  if (gender) {
    product.gender = gender
  }

  // Breadcrumbs
  const breadcrumbs = await page.$$eval('#w-breadcrumbs li', elements => Array.from(elements).map((e: any) => e && String(e.innerText).trim()))
  if (breadcrumbs && breadcrumbs.length) {
    product.breadcrumbs = breadcrumbs
  }

  // Size Chart
  const sizeChartElement = await page.$('.product-size-description')
  if (sizeChartElement) {
    const sizeChartUrl = await sizeChartElement.$eval('a', (element: any) => element.href)

    if (sizeChartUrl) {
      product.sizeChartUrls = [sizeChartUrl]
    }
  }

  // KeyValue Pairs
  const keyValuePairs = await getKeyValuePairs(page)
  if (keyValuePairs) {
    product.keyValuePairs = keyValuePairs

    const color = Object.keys(product.keyValuePairs as any)
      .filter((i)=> String(i)
        .toUpperCase()
        .includes('COLOR'))
      .map(key => `${String(key).toUpperCase().replace(' COLOR', '')}-${(product.keyValuePairs as any)[key]}`)
      .join('/')
      .toUpperCase()

    if (color) {
      product.color = color
    }
  }


  return product
}

async function createProductVariant(baseProduct: Product, productData: any, variantData: any, page: Page): Promise<Product> {
  baseProduct.id = [baseProduct.id, variantData.id].join('_')
  baseProduct.size = variantData.name

  // Prices
  baseProduct.realPrice = productData.prices?.finalPrice?.amount || baseProduct.realPrice
  baseProduct.higherPrice = productData.prices?.oldPrice?.amount || baseProduct.higherPrice

  return baseProduct
}

async function getAdditionalSections(page: Page): Promise<IDescriptionSection[]> {
  const additionalSections: IDescriptionSection[] = []

  // Product Specs
  const productSpecsContent = await page.$eval('div.page-product > div.product-specs', (element: any) => element?.innerHTML.trim())
  if (productSpecsContent) {
    additionalSections.push({
      name: 'Product Specs',
      description_placement: DESCRIPTION_PLACEMENT.DISTANT,
      content: productSpecsContent
    })
  }

  // User manual
  const userManualContent = await page.$eval('#product-user-manual', (element: any) => element?.innerHTML.trim())
  if (userManualContent) {
    additionalSections.push({
      name: 'Product Specs',
      description_placement: DESCRIPTION_PLACEMENT.DISTANT,
      content: userManualContent
    })
  }

  return additionalSections
}

async function getGender(page: Page) {
  return await page.evaluate(() => {
    const data = document.evaluate("//li[contains(., 'Gender')]", document, null, XPathResult.ANY_TYPE, null )
    const element: any = data.iterateNext()

    return element?.querySelector('p')?.textContent
  })
}

async function getKeyValuePairs (page: Page) {
  const keyValuePairs = await page.$$eval('.product-specs li', elements => {
    return elements.reduce((prev: any, curr) => {
      const index = curr?.querySelector('h4')?.innerText
      const value = curr?.querySelector('p')?.innerText
      if (index && value) {
        prev[index] = value
      }

      return prev
    }, {})
  })

  return keyValuePairs
}

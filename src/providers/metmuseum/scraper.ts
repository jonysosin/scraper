import { DESCRIPTION_PLACEMENT, IDescriptionSection } from '../../interfaces/outputProduct'
import { Page } from 'puppeteer'
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: Scraper = async (request, page) => {
  /**
   * Disabled JS files except for Anowave_Ec.js,
   * Why? Because Magento 2 render all the JSON configs for jQuery widgets for all the modules,
   * and when jQuery initialize them, the data is removed from the page, so intercepting the .js files
   * we can get all the data raw sent from the backend to the jQuery widgets.
   */
  await page.setRequestInterception(true);
  page.on('request', (interceptedRequest) => {
    if (interceptedRequest.url().endsWith('.js') && !interceptedRequest.url().includes('Anowave_Ec')) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });
  await page.goto(request.pageUrl, { waitUntil: 'domcontentloaded' })

  // Create Base Product
  const baseProduct = await createBaseProduct(page)
  const products: Product[] = []
  const productVariants: any[] = await page.evaluate(() => {
    const data = (window as any).AEC.CONFIGURABLE_SIMPLES

    return data || []
  })

  if (Object.keys(productVariants).length) {
    for (const id in productVariants) {
      // Process Product with variants
      const product = baseProduct.clone()

      product.id = id
      product.size = await getProductVariantAttribute('size', product, page)
      product.color = await getProductVariantAttribute('color', product, page)
      product.availability = await isProductVariantAvailable(product, page)

      // Variant Product Images
      const variantProductImages = await getProductVariantImages(product, page)
      if (variantProductImages.length) {
        product.images = await getProductVariantImages(product, page)
      }

      // Prices
      const { realPrice, higherPrice } = await getProductVariantPrice(product, page)

      product.realPrice = realPrice
      product.higherPrice = higherPrice

      products.push(product)
    }
  } else {
    // Process Product without variants
    products.push(baseProduct)
  }

  // Take product screenshot
  const screenshot = await screenPage(page)

  // Clear Cache
  productVariantConfigurationCache = productConfigurationCache = null

  return {
    screenshot,
    products,
  }
}

/**
 *
 * Bse Product Data
 *
 */

async function createBaseProduct (page: Page): Promise<Product> {
  const productMetadata = await getProductMetadata(page)
  const product = new Product(productMetadata.id, productMetadata.name, page.url())

  // Main Description
  const description = await page.$eval('[itemprop="description"]', (e) => e.textContent)
  if (description) {
    product.description = description
  }

  // Prices
  product.realPrice = productMetadata.special_price || productMetadata.final_price
  product.higherPrice = productMetadata.max_price
  product.currency = productMetadata.currency_code

  // SKU
  const sku = await page.$eval(('[itemprop="sku"]'), (el) => el.textContent)
  if (sku) {
    product.sku = sku
  }

  // Images
  product.images = (await productMetadata.images || []).map(i => i.url)

  const additionalSections = await getAdditionalSections(page)
  if (additionalSections && additionalSections.length) {
    product.additionalSections = additionalSections
  }

  // Product base - availability information.
  product.availability = await page.$eval('[itemprop="availability"]', (el) => el && el.textContent === 'In Stock')

  // Breadcrumbs
  const breadcrumbs = await page.$$eval('.breadcrumbs li', items => items.map(i => String(i.textContent)))
  if (breadcrumbs.length) {
    product.breadcrumbs = breadcrumbs
  }

  // Bullets
  const bullets = await page.$$eval('.product.info.detailed ul li', items => items.map((e: any) => e?.innerText))
  if (Array.isArray(bullets) && bullets.length) {
    product.bullets = bullets
  }

  // Key value pairs
  const keyValuePairs = await page.$$eval('.product.info.detailed table tr', (items: any) => items.reduce((prev: any, curr: any) => {
    const key = curr.children[0].innerText
      prev[key] = curr.children[1].innerText

      return prev
  }, {}))

  if (keyValuePairs && Object.keys(keyValuePairs).length) {
    product.keyValuePairs = keyValuePairs
  }

  // Size Chart
  const sizeChartHtml = await page.evaluate(() => document.querySelector('size-guide-row2')?.innerHTML)
  if (sizeChartHtml) {
    product.sizeChartHtml = sizeChartHtml
  }

  return product
}

async function getAdditionalSections (page: Page): Promise<IDescriptionSection[]> {
  const additionalSections: IDescriptionSection[] = []
  const sectionsElements = await page.$$eval('.product.info.detailed .data.item.title', elements =>
    elements
      .filter(item => item.querySelector('a')?.title !== 'Shipping & Returns')
      .map(item => ({
        name: item.querySelector('a')?.innerText,
        content: item.querySelector('.content')?.innerHTML.trim()
      }))
  );

  for (const { name, content } of sectionsElements) {
    if (name && content) {
      const descriptionSection: IDescriptionSection = {
        content,
        name,
        description_placement: DESCRIPTION_PLACEMENT.ADJACENT
      }

      additionalSections.push(descriptionSection)
    }
  }

  return additionalSections
}

/**
 *
 * Product Variant Data
 *
 */

async function getProductVariantImages (product: Product, page: Page): Promise<string[]> {
  const variantConfigurations = await getProductVariantConfigurations(page)

  const images = variantConfigurations?.images?.[product.id]

  return (images || []).map(image => image.full)
}

async function getProductVariantPrice (product: Product, page: Page): Promise<{ realPrice: number, higherPrice:number }> {
  const variantConfigurations = await getProductVariantConfigurations(page)
  const prices = variantConfigurations.optionPrices[product.id]

  return { higherPrice: prices?.oldPrice?.amount, realPrice: prices?.finalPrice?.amount }
}

async function getProductVariantAttribute(attributeKey: string, product: Product, page: Page) {
  const productConfiguration = await getProductVariantConfigurations(page)

  const attribute: any = Object.values(productConfiguration.attributes).find((attribute: any) => attribute && attribute.code == attributeKey)
  if (attribute) {
    const attributeValue = attribute.options.find(option => [...option.products, ...option.instockproducts].includes(product.id))
    if (!attributeValue) {
      const a= 1
    }
    return attributeValue.label
  }
}

let productVariantConfigurationCache: any = null
async function getProductVariantConfigurations (page: Page): Promise<any> {
  if (!productVariantConfigurationCache) {
    const stockStatus = await page.evaluate(() => {
      let stock = null
      const stockScript = Array.from(document.querySelectorAll('script')).find(script => script && String(script.textContent).includes('stock_status'))

      if (stockScript && stockScript.textContent) {
        const content = JSON.parse(stockScript.textContent)
        stock = content['[data-role=swatch-options]']['Magento_Swatches/js/swatch-renderer'].jsonConfig
      }

      return stock
    })

    if (stockStatus) {
      productVariantConfigurationCache = stockStatus
    }
  }

  return productVariantConfigurationCache
}

let productConfigurationCache: any = null
async function getProductMetadata (page: Page): Promise<any> {
  if (!productConfigurationCache) {
    const productData: any = await page.evaluate(() => {
      let productData = null
      const stockScript = Array.from(document.querySelectorAll('script')).find(script => script && String(script.textContent).includes('Magento_Catalog/js/product/view/provider'))

      if (stockScript && stockScript.textContent) {
        const content = JSON.parse(stockScript.textContent)
        productData = content["*"]["Magento_Catalog/js/product/view/provider"].data
      }

      return productData
    })

    if (productData) {
      productConfigurationCache = productData.items[Object.keys(productData.items)[0]]
    }
  }

  return productConfigurationCache
}

async function isProductVariantAvailable(product: Product, page: Page): Promise<boolean>{
  const productConfiguration = await getProductVariantConfigurations(page)

  return productConfiguration?.stock_status[product.id]
}

export default scraper

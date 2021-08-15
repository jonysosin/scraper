import { Page } from 'puppeteer';
import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { getBaseProductMetadata } from './helpers';

const scraper: Scraper = async (request, page) => {
  /**
   * Intercept Magento Widgets
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
  const { productData, hasVariants } = await getBaseProductMetadata(page)
  const product = await createBaseProduct(productData, page)
  const products: Product[] = []

  if (hasVariants) {
    // ...
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
  return new Product('id', 'name', 'url')
}


import Product from '../../entities/product'
import IScraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: IScraper = async (request, page) => {
  console.log({ request })

  await page.goto('https://www.nike.com/ar/')
  await page.waitFor(2000)
  const screenshot = await screenPage(page)
  console.log({ screenshot })

  const products = [new Product('id', 'title', 'url')]

  return {
    screenshot,
    products,
  }
}

export default scraper

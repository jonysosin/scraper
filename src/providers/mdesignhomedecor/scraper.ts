import type { Page } from 'puppeteer'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import Product from '../../entities/product'
import { notFound } from '../../errors'
import IScraper from '../../interfaces/scraper'
import { getSelectorTextContent } from '../../providerHelpers/getSelectorTextContent'
import screenPage from '../../utils/capture'
import { extractMetaTags } from '../../utils/extractors'

const getImages = async (page: Page) => {
  return page.evaluate(() => {
    const images: string[] = []
    document.querySelectorAll('.MagicZoomSelectors a').forEach(element => {
      const imageUrl = element.getAttribute('href')
      if (imageUrl) {
        images.push(imageUrl)
      }
    })
    return images
  })
}

const getVideos = async (page: Page) => {
  return page.evaluate(() => {
    const videos: string[] = []
    document
      .querySelectorAll('article .tabs-contents #tab-videos li.videoGallery-item a')
      .forEach(element => {
        const videoId = element.getAttribute('data-video-id')
        if (videoId) {
          videos.push(`https://www.youtube.com/watch?v=${videoId}`)
        }
      })
    return videos
  })
}

const getProductJson = async (page: Page) => {
  await page.waitForFunction('BCData && window.product && window.data')
  return page.evaluate(() => {
    // @ts-ignore
    return { product: window.product, data: window.data, BCData }
  })
}

const scraper: IScraper = async (request, page) => {
  /**
   * Navigate to the regular page to extract more info
   */
  await page.goto(request.pageUrl)

  /**
   * Get the product data from the JSON
   */
  const providerData = await getProductJson(page)

  // Extract all the metaTags
  const metaTags = await extractMetaTags(page)

  /**
   * Check if it's possible to scrap this page
   */
  if (!Array.isArray(providerData?.product?.variants) || !providerData?.product?.variants.length) {
    throw notFound(`Can not scrap product because there're no variants available`)
  }

  /**
   * Get media links
   */
  const images = await getImages(page)
  const videos = await getVideos(page)

  /**
   * Get some key value pairs
   */
  const keyValuePairs = await page.evaluate(() => {
    const additionalInfo: { [key: string]: string } = {}
    document.querySelectorAll('.productView-addition-table tr').forEach(trElement => {
      const key = trElement.querySelectorAll('td')[0]?.textContent
      if (key) {
        additionalInfo[key] = trElement.querySelectorAll('td')[1]?.outerHTML || ''
      }
    })
    return additionalInfo || {}
  })

  const bullets = await page.evaluate(() => {
    const description = document.querySelector('#tab-description')!

    if (!description) return null
    return (
      description
        // @ts-ignore
        .innerText!.trim()
        .split('\n')
        .map((x: any) => x.trim())
        .filter((x: any) => x.length > 0)
    )
  })

  const brand = await page.$eval('.productView-brand', e => (e as HTMLElement).innerText)

  const metaScripts = await page.$$eval('script[type="application/ld+json"]', scripts =>
    scripts.map(s => JSON.parse(s.innerHTML)),
  )
  const prices = metaScripts[1].offers.map((o: any) => ({ sku: o.sku, price: o.price }))

  /**
   * Iterate over all the variants of the product
   */
  const products: Product[] = []
  for (const prodVariant of providerData?.data?.variants) {
    const product = new Product(
      prodVariant.external_id,
      providerData.product.title,
      request.pageUrl,
    )

    // Save all additional data
    product.metadata = {
      rawProductData: providerData,
      metaTags,
    }

    product.itemGroupId = providerData.BCData.product_attributes.sku
    product.sku = prodVariant.sku
    product.matchableIds = [prodVariant.external_id]
    product.color = prodVariant.title
    product.images = images
    product.videos = videos
    product.currency = 'USD'
    product.realPrice = prices.find((p: any) => p.sku === prodVariant.sku)?.price
    product.brand = brand

    product.availability = prodVariant.inventory_quantity > 0
    const description = await getSelectorTextContent(page, '#tab-description > div')
    if (description) {
      product.description = description
    }
    if (keyValuePairs) {
      product.keyValuePairs = keyValuePairs
    }
    if (bullets) {
      product.bullets = bullets
    }

    product.addAdditionalSection({
      content: await page.$eval('#tab-description', e => e.outerHTML),
      description_placement: DESCRIPTION_PLACEMENT.MAIN,
      name: 'DESCRIPTION',
    })
    product.addAdditionalSection({
      content: await page.$eval('#tab-addition', e => e.outerHTML),
      description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
      name: 'ADDITIONAL INFORMATION',
    })

    products.push(product)
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

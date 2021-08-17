import parseUrl from 'parse-url'
import Product from '../../entities/product'
import { IDescriptionSection, DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import IScraper from '../../interfaces/scraper'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import screenPage from '../../utils/capture'
import { Page } from 'puppeteer'
import { TProviderData } from './types'
import { omit } from 'lodash'
import ommitKeys from './omitKeys'
import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { last } from 'lodash'

export const getProductJson = async (page: Page, productUrl: string) => {
  await page.goto(productUrl)

  const productData = await page.evaluate(() => {
    let productObj: TProviderData | null = null
    const pre = document.querySelector('pre')

    if (pre && pre.textContent) {
      try {
        productObj = JSON.parse(pre.textContent.trim())
      } catch (e) {
        console.error(e)
      }
    }

    return productObj
  })

  if (!productData) {
    // TODO: Improve error handling for this cases
    throw new Error(`Could not find product json for ${productUrl}`)
  }

  return productData
}

const scraper: IScraper = async (request, page) => {
  const { protocol, resource, pathname } = parseUrl(request.pageUrl)

  const pid = last(pathname.split('/'))?.split('.html')[0] || ''
  const baseProductUrl = `https://www.altardstate.com/on/demandware.store/Sites-altardstate-Site/default/Product-Variation?pid=${pid}`
  console.log(baseProductUrl)
  const baseProductData = await getProductJson(page, baseProductUrl)

  // Website screenshot
  await page.goto(request.pageUrl)
  const screenshot = await screenPage(page)

  // Additional sections
  const additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
    const sections: IDescriptionSection[] = []
    document.querySelectorAll('.pdp-description-details .accordion-wrapper').forEach(element => {
      const name = (element.querySelector('.pdp-link-desc-detail')?.textContent || '')
        .replaceAll('\n', '')
        .trim()
      const content = (element.querySelector('.more-info-body')?.outerHTML || '')
        .replaceAll('\n', '')
        .trim()
      sections.push({ name, content, description_placement: DESCRIPTION_PLACEMENT.ADJACENT })
    })
    return sections
  }, DESCRIPTION_PLACEMENT)

  // Size chart html
  const sizeChartHtml = await getSelectorOuterHtml(
    page,
    '#openSizeGuideModal > div > div > div.modal-body > div',
  )

  // Breadcrumbs
  const breadcrumbs = baseProductData.variantGTMJson[0].category.split('/')

  // Products / Variants
  const products: Product[] = []
  const variantsData = getProductVariantUrls(baseProductData, baseProductUrl, pid)
  for (const variantData of variantsData) {
    const { id, url } = variantData

    console.log(url)

    const productData = await getProductJson(page, url)
    const title = productData.product.productName
    const productUrl = `${protocol}://${resource}${productData.product.selectedProductUrl}`
    const product = new Product(id, title, productUrl)

    product.itemGroupId = productData.variantGTMJson[0].product_style_id
    product.sku = id // TODO: find the real sku
    product.brand = productData.product.brand

    product.images = productData.product.images.large.map(x => x.url)
    if (product.images.length === 1 && product.images[0].includes('noimage')) {
      product.images = []
    }

    const variantSize = productData.product.variationAttributes
      .find(x => x.attributeId === 'size')
      ?.values.find(x => !!x.selected)
    const variantColor = productData.product.variationAttributes
      .find(x => x.attributeId === 'color')
      ?.values.find(x => !!x.selected)

    product.size = variantSize?.displayValue
    product.color = variantColor?.displayValue

    product.realPrice = productData.product.price.sales?.value
    product.higherPrice = productData.product.price.list?.value
    product.currency = productData.product.price.sales.currency
    product.availability =
      productData.product.available && variantSize?.selectable && variantColor?.selectable
    product.description = parseHtmlTextContent(productData.product.longDescription)
    product.bullets = Object.values(omit(productData.product, ommitKeys)) as string[]
    product.keyValuePairs = omit(productData.product, ommitKeys) as { string: string }
    product.breadcrumbs = breadcrumbs
    product.sizeChartHtml = sizeChartHtml
    product.addAdditionalSections(additionalSections)

    products.push(product)
  }

  return { screenshot, products }
}

export default scraper

const getProductVariantUrls = (
  baseProductData: TProviderData,
  baseProductUrl: string,
  productId: string,
) => {
  const variants = baseProductData.product.variationAttributes.map(({ attributeId, values }) =>
    values.map(x => `${attributeId}:${x.value}`),
  )
  const combinedVariants = combine(variants)

  // console.log('combinedVariants', combinedVariants)

  const variantsData: any[] = []
  combinedVariants.forEach(variant => {
    let url = baseProductUrl
    variant.split('-').forEach((attr: string) => {
      const [key, value] = attr.split(':')
      url += `&dwvar_${productId.split('_').join('__')}_${key}=${value}`
    })
    url += '&quantity=1'
    variantsData.push({ id: `${productId}-${variant}`, url })
  })

  return variantsData
}

const combine = (options: string[][], splitter = '-'): string[] => {
  const [head, ...[headTail, ...tailTail]] = options

  if (!headTail) return head

  const combined = headTail.reduce((acc: string[], x: string) => {
    return acc.concat(head.map(h => `${h}${splitter}${x}`))
  }, [])

  return combine([combined, ...tailTail])
}

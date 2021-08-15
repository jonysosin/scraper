import Product from "../../entities/product";
import { Page } from "puppeteer";

export async function getBaseProductMetadata (page: Page): Promise<{productData: any, hasVariants: Boolean}> {
  const productId = await page.$eval('[name="product_id"]', (el: any) => el.value)
  const data = await getMagentoWidgetData('Magento_Catalog/js/product/view/provider', page)
  const productData = data['*']["Magento_Catalog/js/product/view/provider"].data
  const productVariantMetadata = await getMagentoWidgetData('priceOptions', page)

  return { hasVariants: !!productVariantMetadata, productData: productData.items[productId]}
}

export async function getProductVariantMetadata (page: Page) {
  const data = await getMagentoWidgetData('priceOptions', page)
}

async function getMagentoWidgetData (widgetKey: string, page: Page) {
  return await page.evaluate((widgetKey) => {
    let scriptContent
    const script = Array.from(document.querySelectorAll('script')).find(script => script && String(script.textContent).includes(widgetKey))

    if (script && script.textContent) {
      const content = JSON.parse(script.textContent)

      scriptContent = content
    }

    return scriptContent
  }, widgetKey)
}

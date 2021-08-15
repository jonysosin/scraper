import { Page } from "puppeteer";
import _ from 'lodash'

export async function getBaseProductMetadata(page: Page): Promise<{ productData: any, hasVariants: Boolean, variantData: any }> {
  const productId = await getItemPropValue('data-product-id', page)
  const productWidgetKey = "Magento_Catalog/js/product/view/provider"
  const data = await getMagentoWidgetData(productWidgetKey, page)
  const productData = _.get(data, `*.${productWidgetKey}.data`, false)
  const productVariantMetadata = await getProductVariantMetadata(page)

  return {
    hasVariants: !!productVariantMetadata.length,
    variantData: productVariantMetadata,
    productData: productData.items[productId]
  }
}

export async function getProductVariantMetadata(page: Page) {
  const widgetData = await getMagentoWidgetData('priceOptions', page)
  const variantData = _.get(widgetData, '#product_addtocart_form.priceOptions.optionConfig')

  const map: any[] = []
  if (variantData) {
    const configurations: any = Object.entries(variantData)
    for (const config of configurations) {
      for (const [subConfigId, subConfig] of Object.entries(config[1])) {
        const variantConfig = { id: [config[0], subConfigId].join('_'), ...(subConfig as any) }
        map.push(variantConfig)
      }
    }
  }

  return map
}

async function getMagentoWidgetData(widgetKey: string, page: Page) {
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

export async function getItemPropValue (key: string, page: Page): Promise<any> {
  return await page.evaluate((key) => {
    const skuElement = document.querySelector(`[${key}]`)

    return skuElement?.getAttribute(key)
  }, key)
}

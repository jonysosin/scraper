import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'
import { TMediaImage } from '../shopify/types'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { additionalSections: [] }

      /**
       * Bullets
       */
      extraData.bullets = await page.evaluate(() => {
        const sizeGuideButton = document.evaluate(
          "//h1[contains(., 'Features')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const sizeGuideButtonSelector = sizeGuideButton.iterateNext()
        if (sizeGuideButtonSelector) {
          return Array.from(
            sizeGuideButtonSelector?.parentElement?.querySelectorAll('p') || [],
          ).map(e => e.textContent?.trim() || '')
        }
        return []
      })

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const description = await page.evaluate(() => {
        return document.querySelector('form[novalidate]')?.firstElementChild?.outerHTML
      })
      if (description) {
        extraData.additionalSections?.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      /**
       * Get the Details section
       */
      const detailsSection = await page.evaluate(() => {
        const header = document.evaluate(
          "//button[contains(., 'Details')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = header.iterateNext()
        return thisHeading?.parentElement?.nextElementSibling?.outerHTML
      })
      if (detailsSection) {
        extraData.additionalSections?.push({
          name: 'Details',
          content: detailsSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get the Details section
       */
      const fabricSection = await page.evaluate(() => {
        const header = document.evaluate(
          "//button[contains(., 'Fabric')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = header.iterateNext()
        return thisHeading?.parentElement?.nextElementSibling?.outerHTML
      })
      if (fabricSection) {
        extraData.additionalSections?.push({
          name: 'Fabric',
          content: fabricSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get the Details section
       */
      const productCareSection = await page.evaluate(() => {
        const header = document.evaluate(
          "//button[contains(., 'Product Care')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = header.iterateNext()
        return thisHeading?.parentElement?.nextElementSibling?.outerHTML
      })
      if (productCareSection) {
        extraData.additionalSections?.push({
          name: 'Product Care',
          content: productCareSection,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get the size chart (tricky way)
       */
      await page.evaluate(() => {
        const sizeGuideButton = document.evaluate(
          "//p[contains(., 'Size guide')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        // @ts-ignore
        sizeGuideButton.iterateNext()?.click()
      })

      // Wait 3 seconds after the click so the size chart loads
      await page.waitForTimeout(3000)

      const sizeChartHtml = await page.evaluate(() => {
        const header = document.evaluate(
          "//h2[contains(., 'Size Guide')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const sizeGuideSelector = header.iterateNext()
        return sizeGuideSelector?.parentElement?.parentElement?.outerHTML
      })

      if (sizeChartHtml) {
        extraData.sizeChartHtml = sizeChartHtml
      }

      return extraData
    },
    variantFn: async (_request, _page, product, providerProduct, providerVariant) => {
      /**
       * Get the list of options for the variants of this provider
       * (5) ["Size", "Color", "Title", "Bottoms", "Tops"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color) {
        product.color = optionsObj.Color
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Replace all the product images with the ones related by color (only if there're matches)
       */
      if (product.color) {
        const color = product.color.replace(/\//g, '-').replace(/\s/g, '-').toLowerCase()
        const images = (providerProduct.media as TMediaImage[])
          .filter(e => e.alt === `gallery ${color}`)
          .map(e => e?.src)
          .filter(e => e !== '')

        if (images.length) {
          product.images = images
        }
      }

      /**
       * Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
       */
      product.additionalSections.shift()
    },
  },
  {},
)

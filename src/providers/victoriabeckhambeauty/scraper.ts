
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper from '../shopify/scraper'
import { IVictoriaBeckhamBeautyCustomProduct, TVictoriaBeckhamBeautyExtraData } from './types'

export default shopifyScraper(
  {
    urls: url => {
      const parsedUrl = new URL(url)
      return {
        jsonUrl: `https://shop.victoriabeckhambeauty.com${parsedUrl.pathname}`,
        htmlUrl: `https://victoriabeckhambeauty.com${parsedUrl.pathname}`,
      }
    },
    productFn: async (_request, page, providerProduct) => {
      const url = new URL(_request.pageUrl)

      // Remove promotion popups
      await page.setCookie(
        {
          url: `${url.protocol}//${url.host}/`,
          name: 'vbb_newsletter_popup_seen',
          value: 'true'
        }
      )

      // Set USA variant
      await page.evaluate(() => localStorage.setItem('vbb:geoip', JSON.stringify({"country":"EN","currency":"USD"})))

      // Reload to apply changes
      await page.reload()

      const extraData: TVictoriaBeckhamBeautyExtraData = {}

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('.breadcrumb > a, .breadcrumb > span:not(.breadcrumb__spacer)'),
        )
          .map(e => e.textContent?.trim() || '')
          .filter(e => e !== '')
      })

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(document.querySelectorAll('.product-description-wrapper > ul > li'))

        // Get a list of content for the titles above
        const values = Array.from(document.querySelectorAll('.product-description-wrapper > div'))

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].textContent?.trim() || `key_${i}`] = value.outerHTML?.trim() || ''
          return acc
        }, {})
      })

      const additionalSections = await page.$$eval('.content-block-container__block', (elements) => {
        return elements.map(element => ({
          name: element.id,
          content: element.innerHTML
        }))
      })

      extraData.additionalSections = additionalSections.map(section => ({
        ...section,
        description_placement: DESCRIPTION_PLACEMENT.DISTANT
      }))

      extraData.videos = await page.$$eval(
        '.content-block-container__block video',
        (videos) => videos.map(video => (video as HTMLVideoElement).src!)
      )

      extraData.images = await page.$$eval(
        '.content-block-container__block img',
        (imgs) => imgs.map(img => (img as HTMLImageElement).src!)
      )

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(page, 'div[data-remodal-id=size-chart]')

      /**
       * This page has custom data per variant
       */
      const customDataFile = await page.goto(
        `https://www.victoriabeckhambeauty.com/assets/data/products/${providerProduct.handle}/index.json`,
      )

      const customData: IVictoriaBeckhamBeautyCustomProduct = await customDataFile.json()
      const customProduct = customData.data.product

      if (customProduct.contentful.ingredientTechnology) {
        extraData.additionalSections = [
          ...extraData.additionalSections,
          {
            name: 'ingredientTechnology',
            content: customProduct.contentful.ingredientTechnology,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT
          }
        ]
      }

      if (customProduct.contentful.howTo) {
        extraData.additionalSections = [
          ...extraData.additionalSections,
          {
            name: 'howTo',
            content: customProduct.contentful.description,
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT
          }
        ]
      }

      if (customProduct.contentful?.howTo?.videoWithPoster?.poster) {
        extraData.images = [
          ...extraData.images,
          `https://${url.hostname}${customProduct.contentful.howTo.videoWithPoster.poster.src}`
        ]
      }

      if (customProduct.contentful?.howTo?.videoWithPoster?.video) {
        extraData.videos = [
          ...extraData.videos,
          `https://${url.hostname}${customProduct.contentful.howTo.videoWithPoster.video.src}`
        ]
      }

      const variants = customProduct.variants.map(variant => {
        const variantUrl = new URL(url.toString())
        variantUrl.pathname = customProduct.path
        variantUrl.search =  '?' + new URLSearchParams({ variant: variant.legacyId.USD }).toString()
        return {
          ...variant,
          url: variantUrl.toString()
        }
      })

      extraData.variants = Object.fromEntries(variants.map(variant => [ variant.legacyId.USD, variant ]))

      return extraData
    },
    variantFn: async (
      _request,
      _page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TVictoriaBeckhamBeautyExtraData,
    ) => {

      const url = new URL(_request.pageUrl)
      const customVariant = (_extraData.variants || {})[providerVariant.id]

      if (customVariant) {
        product.url = customVariant.url
        product.sku = customVariant.sku
        product.realPrice = customVariant.price.USD
        product.higherPrice = customVariant.compareAtPrice.USD || customVariant.price.USD

        product.images = [
          ...product.images,
          ...customVariant.contentful.images
            .filter(image => image.type === 'image')
            .map((image) => `https://${url.hostname}${image.src}`)
        ]

        product.videos = [
          ...product.videos,
          ...customVariant.contentful.images
            .filter(image => image.type === 'video')
            .map((image) => `https://${url.hostname}${image.src}`)
        ]

        product.availability =customVariant.availableForSale

        if (customVariant.contentful.subtitle) {
          product.subTitle = customVariant.contentful.subtitle
        }
      }

      /**
       * Get the list of options for the variants of this provider
       * (6) ["Color", "Title", "Size", "Shade", "+ Sharpener", "Palette"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (optionsObj.Color || optionsObj.Shade || optionsObj.Palette) {
        product.color = optionsObj.Color || optionsObj.Shade || optionsObj.Palette
      }

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
    },
  },
  {},
)

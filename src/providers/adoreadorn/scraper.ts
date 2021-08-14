import parseHtmlTextContent from '../../providerHelpers/parseHtmlTextContent'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getSelectorOuterHtml } from '../../providerHelpers/getSelectorOuterHtml'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = { metadata: {} }

      /**
       * Get additional descriptions and information
       */
      extraData.additionalSections = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const accordions = Array.from(
          document.querySelectorAll('.s-product__header-section.dropdown'),
        )
        // Get a list of titles
        const keys = accordions.map(e =>
          e.querySelector('.b-dropdown-header p')?.textContent?.trim(),
        )

        // Get a list of content for the titles above
        const values = accordions.map(e =>
          e.querySelector('.s-product__dropdown-content')?.innerHTML?.trim(),
        )

        // Join the two arrays
        return values.map((value, i) => {
          return {
            name: keys[i] || `key_${i}`,
            content: value || '',
            description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
          }
        })
      }, DESCRIPTION_PLACEMENT)

      /**
       * Add "Materials" section
       */
      const materialsSection = await getSelectorOuterHtml(page, '.s-product-materials')
      if (materialsSection) {
        extraData.additionalSections.push({
          name: 'Materials',
          content: materialsSection,
          description_placement: DESCRIPTION_PLACEMENT.DISTANT,
        })
      }

      /**
       * Extract materials in an object format like this:
       * [
       *  {
       *     "name": "Smoky Quartz",
       *     "description": "Balance & Grounding, Frees from Negative Energies",
       *     "image": "//cdn.shopify.com/s/files/1/2525/7200/articles/SMOKEY_QUARTZ.jpg?v=1604257591"
       *  },
       *  {
       *     "name": "Black Mother of Pearl",
       *     "description": "Helps on a Personal Level to Increase Will Power + Will Help Free Your Mind",
       *     "image": "//cdn.shopify.com/s/files/1/2525/7200/articles/Mlack_Mother_of_Pearl.png?v=1606469114"
       *  }
       * ]
       */
      extraData.metadata = {
        materials: await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.s-product-materials__list .s-product-materials__list-item-inner',
            ),
          ).map(e => {
            return {
              name: e.querySelector('.s-product-materials__image-title')?.textContent?.trim(),
              description: e
                .querySelector('.s-product-materials__image-subtitle')
                ?.textContent?.trim(),
              image: e
                .querySelector('.s-product-materials__image')
                ?.getAttribute('style')
                ?.replace(/.*url\((.*)\);/gi, '$1'),
            }
          })
        }),
      }

      /**
       * Extract the 360 videos (if any)
       */
      extraData.videos = await page.evaluate(() => {
        return [
          ...new Set(
            Array.from(document.querySelectorAll('.product__video-wrapper video source'))
              .map(e => e.getAttribute('src') || '')
              .filter(e => e !== ''),
          ),
        ]
      })

      /**
       * "The Story Behind This Piece"
       * // TODO: Once we got an extractor for .mp4
       */
      const { video, section } = await page.evaluate(DESCRIPTION_PLACEMENT => {
        const header = document.evaluate(
          "//h2[contains(., 'The Story Behind This Piece')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null,
        )
        const thisHeading = header.iterateNext()
        const section =
          thisHeading?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement

        if (section && section.outerHTML?.trim()) {
          const video = section?.querySelector('video source')?.getAttribute('src')
          return {
            video,
            section: {
              name: 'The Story Behind This Piece',
              content: section?.outerHTML?.trim(),
              description_placement: DESCRIPTION_PLACEMENT.DISTANT,
            },
          }
        }
        return {}
      }, DESCRIPTION_PLACEMENT)
      if (video) {
        extraData.videos = [...extraData.videos, video]
      }
      if (section) {
        extraData.additionalSections.push(section)
      }

      /**
       * Get Size Chart HTML (in this case, it's only a <img>)
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(
        page,
        '.s-product__description-size-image',
      )

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       * (12) ["Color", "Size", "Title", "Metal", "Color Choice", "Necklace Color", "Bangle Metal", "Amount", "Metal Finish", "Metal Type", "Stone Color", "Material Color"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)
      if (
        optionsObj.Color ||
        optionsObj['Color Choice'] ||
        optionsObj['Necklace Color'] ||
        optionsObj['Stone Color'] ||
        optionsObj['Material Color']
      ) {
        product.color =
          optionsObj.Color ||
          optionsObj['Color Choice'] ||
          optionsObj['Necklace Color'] ||
          optionsObj['Stone Color'] ||
          optionsObj['Material Color']
      }
      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }

      /**
       * Filter videos by option (if possible):
       * Remove the videos that depend on an option that is different to the one we've for this variant
       */
      const regex = /(.*)(, Options: )(.*)/
      const videos = extraData.videos
        ?.map(e => {
          if (e?.match(regex)) {
            if (e.replace(regex, '$3') === product.color) {
              return e.replace(regex, '$1')
            } else {
              return ''
            }
          } else {
            return e.replace(regex, '$1')
          }
        })
        .filter(e => e !== '')
      if (Array.isArray(videos) && videos.length) {
        product.videos = videos
      }

      // We're commenting this because it includes videos outside the sections of interest
      // /**
      //  * Get a list of videos
      //  */
      // const videos = await page.evaluate(() => {
      //   return Array.from(
      //     document.querySelectorAll('.s-two-col .s-two-col__video-desktop video source'),
      //   ).map(e => e?.getAttribute('src') || '')
      // })

      // if (Array.isArray(videos) && videos.length) {
      //   product.videos = [...product.videos, ...videos]
      // }

      /**
       * Replace the original description with the one displayed in the website
       */
      await page.evaluate(() => {
        document.querySelector('.s-product__dropdown-header')?.remove()
      })
      const descriptionSection = await getSelectorOuterHtml(
        page,
        '.s-product__header-content .b-desktop-only.s-product__header-section > div ',
      )
      if (descriptionSection) {
        // Remove the first element of the array, as the additional section captured by the generic shopify scraper is not correct in this case
        product.additionalSections.shift()

        product.description = parseHtmlTextContent(descriptionSection)
        product.additionalSections.push({
          name: 'Description',
          content: descriptionSection,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }
    },
  },
  {},
)

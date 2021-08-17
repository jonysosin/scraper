import Product from '../../entities/product'
import Scraper from '../../interfaces/scraper'
import screenPage from '../../utils/capture'

const scraper: Scraper = async (request, page) => {
  await page.goto(request.pageUrl)

  const gaa = await page.evaluate(() => gaa)

  const collections = await page.$$eval('.swatches-collection li', collections =>
    collections.map((collection: any) => ({
      key: collection?.dataset.collection,
      // some out-of-stock colors aren't shown in the picker but we list them anyways.
      colors: collection?.dataset.colors.split('|').filter(s => s),
    })),
  )

  const sizes = await page.$$eval('.swatches-size li a', sizes =>
    sizes.map((size: any) => size.href.split('_size=')[1].split('&')[0]),
  )

  const breadcrumbs = await page.$$eval('.ar-category-breadcrumbs ul li', items =>
    items.map((e: any) => e.textContent?.split('—')[0]?.trim() || '').filter(s => s),
  )

  const variantsURLs = []

  if (!collections.length) {
    // no collections
    const colors = await page.$$eval('.swatch-strike a', colors =>
      colors.map((color: any) => color.href.split('_color=')[1].split('&')[0]),
    )

    for (const color of colors) {
      for (const size of sizes) {
        const id = gaa.product.id
        variantsURLs.push({
          // @ts-ignore
          imagesURL: `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/Product-GetProductImages?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&format=ajax`,
          // @ts-ignore
          detailsURL: `https://www.aritzia.com/intl/en/product/variation?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&format=ajax`,
        })
      }
    }
  } else {
    for (const { key, colors } of collections) {
      for (const color of colors) {
        for (const size of sizes) {
          const id = gaa.product.id
          variantsURLs.push({
            // @ts-ignore
            imagesURL: `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/Product-GetProductImages?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&dwvar_${id}_collection=${key}&format=ajax`,
            // @ts-ignore
            detailsURL: `https://www.aritzia.com/intl/en/product/variation?pid=${id}&dwvar_${id}_color=${color}&dwvar_${id}_size=${size}&dwvar_${id}_collection=${key}&format=ajax`,
          })
        }
      }
    }
  }

  const products: Product[] = []

  let counter = variantsURLs.length

  for (const { detailsURL, imagesURL } of variantsURLs) {
    console.log(--counter)

    await page.goto(detailsURL, { waitUntil: 'domcontentloaded' })

    // re-run script with details
    await page.evaluate(() => {
      //@ts-ignore
      window.gaa = {}
      //@ts-ignore
      eval(document.querySelector('script').innerHTML)
    })

    const data = await page.evaluate(() => gaa.product)
    const subTitle = await page.$eval(
      '.pdp-product-name__subtitle',
      e => e.textContent?.trim() || '',
    )
    const description = await page.$eval(
      '.js-product-accordion__content.f0',
      e => e.textContent?.trim() || '',
    )

    const bullets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.js-product-accordion ul')[0].querySelectorAll('li'))
        .map(i => i.textContent?.trim() || '')
        .filter(s => s),
    )

    const keyValuePairs = await page.evaluate(() =>
      Object.fromEntries(
        Array.from(document.querySelectorAll('.js-product-accordion ul')[1].querySelectorAll('li'))
          .map((i: any) => i.textContent.split(';').map(i => i.trim().split(':')))
          .flat(),
      ),
    )

    await page.goto(imagesURL, { waitUntil: 'domcontentloaded' })

    const images = await page.$$eval('img[data-original]', images =>
      images.map((img: any) => img.dataset?.original || '').filter(s => s),
    )

    // sizeChart

    await page.goto(
      `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/SizeGuideCharts-GetSizeGuide?pid=${data.id}&variantimgoveride=true&sizeRun=oversized&currentSize=${data.size}&action=quickview-open&source=sizeguide&format=ajax`,
    )
    console.log(
      `https://www.aritzia.com/on/demandware.store/Sites-Aritzia_INTL-Site/default/SizeGuideCharts-GetSizeGuide?pid=${data.id}&variantimgoveride=true&sizeRun=oversized&currentSize=${data.size}&action=quickview-open&source=sizeguide&format=ajax`,
    )

    /* prettier-ignore */
    const sizeChartMap = {bust:{exclude:["A06","A07"],measurements:{alpha:{"3XS":{inches:{min:"29",max:""},cm:{min:"74",max:""}},"2XS":{inches:{min:"30 1/2",max:""},cm:{min:"77",max:""}},XS:{inches:{min:"32",max:"33"},cm:{min:"81",max:"84"}},S:{inches:{min:"34",max:"35"},cm:{min:"86",max:"89"}},M:{inches:{min:"36",max:"37 1/2"},cm:{min:"91",max:"95"}},L:{inches:{min:"39",max:"40 1/2"},cm:{min:"99",max:"103"}},XL:{inches:{min:"42",max:""},cm:{min:"107",max:""}},"2XL":{inches:{min:"45",max:""},cm:{min:"114",max:""}}},numeric:{"00":{inches:{min:"30 1/2",max:""},cm:{min:"77",max:""}},0:{inches:{min:"32",max:""},cm:{min:"81",max:""}},2:{inches:{min:"33",max:""},cm:{min:"84",max:""}},4:{inches:{min:"34",max:""},cm:{min:"86",max:""}},6:{inches:{min:"35",max:""},cm:{min:"89",max:""}},8:{inches:{min:"36",max:""},cm:{min:"91",max:""}},10:{inches:{min:"37 1/2",max:""},cm:{min:"95",max:""}},12:{inches:{min:"39",max:""},cm:{min:"99",max:""}},14:{inches:{min:"40 1/2",max:""},cm:{min:"103",max:""}},16:{inches:{min:"42",max:""},cm:{min:"107",max:""}}},split:{"3XS":{inches:{min:"29",max:""},cm:{min:"74",max:""}},"2XS":{inches:{min:"30 1/2",max:""},cm:{min:"77",max:""}},"XS/S":{inches:{min:"32",max:"35"},cm:{min:"81",max:"89"}},"M/L":{inches:{min:"36",max:"40 1/2"},cm:{min:"91",max:"103"}},XL:{inches:{min:"42",max:""},cm:{min:"107",max:""}},"2XL":{inches:{min:"45",max:""},cm:{min:"114",max:""}}},oversized:{1:{inches:{min:"30 1/2",max:"33"},cm:{min:"77",max:"84"}},2:{inches:{min:"34",max:"37 1/2"},cm:{min:"86",max:"95"}},3:{inches:{min:"39",max:"42"},cm:{min:"99",max:"107"}}}}},waist:{exclude:[],measurements:{alpha:{"3XS":{inches:{min:"21",max:""},cm:{min:"53",max:""}},"2XS":{inches:{min:"22 1/2",max:""},cm:{min:"57",max:""}},XS:{inches:{min:"24",max:"25"},cm:{min:"61",max:"64"}},S:{inches:{min:"26",max:"27"},cm:{min:"66",max:"69"}},M:{inches:{min:"28",max:"29 3/4"},cm:{min:"71",max:"76"}},L:{inches:{min:"31 1/2",max:"33 1/4"},cm:{min:"80",max:"84"}},XL:{inches:{min:"35",max:""},cm:{min:"89",max:""}},"2XL":{inches:{min:"38 1/2",max:""},cm:{min:"98",max:""}}},numeric:{"00":{inches:{min:"22 1/2",max:""},cm:{min:"57",max:""}},0:{inches:{min:"24",max:""},cm:{min:"61",max:""}},2:{inches:{min:"25",max:""},cm:{min:"64",max:""}},4:{inches:{min:"26",max:""},cm:{min:"66",max:""}},6:{inches:{min:"27",max:""},cm:{min:"69",max:""}},8:{inches:{min:"28",max:""},cm:{min:"71",max:""}},10:{inches:{min:"29 3/4",max:""},cm:{min:"76",max:""}},12:{inches:{min:"31 1/2",max:""},cm:{min:"80",max:""}},14:{inches:{min:"33 1/4",max:""},cm:{min:"84",max:""}},16:{inches:{min:"35",max:""},cm:{min:"89",max:""}},23:{inches:{min:"23 1/2",max:""},cm:{min:"60",max:""}},24:{inches:{min:"24 1/2",max:""},cm:{min:"62",max:""}},25:{inches:{min:"25 1/2",max:""},cm:{min:"65",max:""}},26:{inches:{min:"26 1/2",max:""},cm:{min:"67",max:""}},27:{inches:{min:"27 1/2",max:""},cm:{min:"70",max:""}},28:{inches:{min:"28 1/2",max:""},cm:{min:"72",max:""}},29:{inches:{min:"29 1/2",max:""},cm:{min:"75",max:""}},30:{inches:{min:"30 1/2",max:""},cm:{min:"77",max:""}},31:{inches:{min:"31 1/2",max:""},cm:{min:"80",max:""}},32:{inches:{min:"32 1/2",max:""},cm:{min:"83",max:""}}},split:{"3XS":{inches:{min:"21",max:""},cm:{min:"53",max:""}},"2XS":{inches:{min:"22 1/2",max:""},cm:{min:"57",max:""}},"XS/S":{inches:{min:"24",max:"27"},cm:{min:"61",max:"69"}},"M/L":{inches:{min:"28",max:"33 1/4"},cm:{min:"71",max:"84"}},XL:{inches:{min:"42",max:""},cm:{min:"89",max:""}},"2XL":{inches:{min:"38 1/2",max:""},cm:{min:"98",max:""}}},oversized:{1:{inches:{min:"22 1/2",max:"25"},cm:{min:"57",max:"64"}},2:{inches:{min:"26",max:"29 3/4"},cm:{min:"66",max:"76"}},3:{inches:{min:"31 1/2",max:"35"},cm:{min:"80",max:"89"}}}}},hips:{exclude:["A01","A02","A03"],measurements:{alpha:{"3XS":{inches:{min:"31",max:""},cm:{min:"79",max:""}},"2XS":{inches:{min:"32 1/2",max:""},cm:{min:"83",max:""}},XS:{inches:{min:"34",max:"35"},cm:{min:"86",max:"89"}},S:{inches:{min:"36",max:"37"},cm:{min:"91",max:"94"}},M:{inches:{min:"38",max:"39 1/2"},cm:{min:"97",max:"100"}},L:{inches:{min:"41",max:"42 1/2"},cm:{min:"104",max:"108"}},XL:{inches:{min:"44",max:""},cm:{min:"112",max:""}},"2XL":{inches:{min:"47",max:""},cm:{min:"119",max:""}}},numeric:{"00":{inches:{min:"32 1/2",max:""},cm:{min:"83",max:""}},0:{inches:{min:"34",max:""},cm:{min:"86",max:""}},2:{inches:{min:"35",max:""},cm:{min:"89",max:""}},4:{inches:{min:"36",max:""},cm:{min:"91",max:""}},6:{inches:{min:"37",max:""},cm:{min:"94",max:""}},8:{inches:{min:"38",max:""},cm:{min:"97",max:""}},10:{inches:{min:"39 1/2",max:""},cm:{min:"100",max:""}},12:{inches:{min:"41",max:""},cm:{min:"104",max:""}},14:{inches:{min:"42 1/2",max:""},cm:{min:"108",max:""}},16:{inches:{min:"44",max:""},cm:{min:"112",max:""}},23:{inches:{min:"33 1/2",max:""},cm:{min:"85",max:""}},24:{inches:{min:"34 1/2",max:""},cm:{min:"88",max:""}},25:{inches:{min:"35 1/2",max:""},cm:{min:"90",max:""}},26:{inches:{min:"36 1/2",max:""},cm:{min:"93",max:""}},27:{inches:{min:"37 1/2",max:""},cm:{min:"95",max:""}},28:{inches:{min:"38 1/2",max:""},cm:{min:"98",max:""}},29:{inches:{min:"39 1/2",max:""},cm:{min:"100",max:""}},30:{inches:{min:"40 1/2",max:""},cm:{min:"103",max:""}},31:{inches:{min:"41 1/2",max:""},cm:{min:"105",max:""}},32:{inches:{min:"42 1/2",max:""},cm:{min:"108",max:""}}},split:{"3XS":{inches:{min:"31",max:""},cm:{min:"79",max:""}},"2XS":{inches:{min:"32 1/2",max:""},cm:{min:"83",max:""}},"XS/S":{inches:{min:"34",max:"37"},cm:{min:"86",max:"94"}},"M/L":{inches:{min:"38",max:"42 1/2"},cm:{min:"97",max:"108"}},XL:{inches:{min:"44",max:""},cm:{min:"112",max:""}},"2XL":{inches:{min:"47",max:""},cm:{min:"119",max:""}}},oversized:{1:{inches:{min:"32 1/2",max:"35"},cm:{min:"83",max:"89"}},2:{inches:{min:"36",max:"39 1/2"},cm:{min:"91",max:"100"}},3:{inches:{min:"41",max:"44"},cm:{min:"104",max:"112"}}}}}};

    console.log(data.department)

    const sizeChartData = Object.entries(sizeChartMap)
      // @ts-ignore
      .filter(([key, { exclude }]) => !exclude.includes(data.department))
      .map(([key, { measurements }]) => )

    console.log(sizeChartData)

    await new Promise(r => setTimeout(r, 30000000))

    const variant = new Product(
      `${data.id}-${data.variant}`,
      data.name,
      // @ts-ignore
      detailsURL.replace('&format=ajax', ''),
    )

    const options = {
      size: data.size,
      color: data.color,
      collection: page.url()?.split('_collection=')[1]?.split('&')[0] ?? undefined,
    }

    variant.subTitle = subTitle
    variant.description = description
    variant.brand = data.brand
    variant.currency = data.currency
    variant.realPrice = data.price
    variant.higherPrice = data.listPrice || data.price
    variant.sku = data.variant
    variant.itemGroupId = data.id
    variant.color = data.color
    variant.size = data.size
    variant.breadcrumbs = breadcrumbs
    variant.bullets = bullets
    variant.keyValuePairs = keyValuePairs
    variant.availability = data.availability.toLowerCase() !== 'not available'
    variant.images = images
    variant.options = options
    // variant.sizeChartData = sizeChartData

    products.push(variant)
  }

  const screenshot = await screenPage(page)

  return {
    screenshot,
    products,
  }
}

export default scraper

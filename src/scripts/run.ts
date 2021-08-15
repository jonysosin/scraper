/* eslint-disable @typescript-eslint/ban-ts-comment */
import { join } from 'path'
import { load } from 'js-yaml'
import handler from '../handlers'
import { makeContext, makeMessage } from './utils'
import type IOutputProduct from '../interfaces/outputProduct'
import { chunk, pick } from 'lodash'
import axios from 'axios'
import { readFile, writeFile } from 'fs/promises'
import format from 'dateformat'

interface URL {
  [provider: string]: string[]
}

const fields: (keyof IOutputProduct)[] = [
  'link',
  'id',
  'title',
  'display_color',
  'size',
  'real_price',
  'higher_price',
  'availability',
  'breadcrumbs',
  'bullets',
  'key_value_pairs',
  'brand',
  'sub_brand',
  'age_group',
  'color_family',
  'currency',
  'description',
  'gender',
  'image_links',
  'videos',
  'item_group_id',
  'variant_matchable_id',
  'parent_website_url',
  'product_group_matchable_id',
  'fb_pixel_content_id',
  'fb_pixel_content_type',
  'size_chart_data',
  'size_chart_html',
  'size_chart_links',
  'size_chart_titles',
  'description_structured',
  'options',
]

const { SHEETDB_URL } = process.env

const api = SHEETDB_URL && axios.create({ baseURL: SHEETDB_URL })

const createSheet = async (name: string) => {
  if (!api) return
  return api.post('/sheet', { name, first_row: fields })
}

const appendProducts = async (sheet: string, products: IOutputProduct[]) => {
  if (!api) return
  return api.post(
    '/',
    {
      data: products.map(product =>
        Object.entries(pick(product, fields)).reduce(
          (obj, [key, value]) => ({
            ...obj,
            [key]: typeof value === 'boolean' ? JSON.stringify(value) : value,
          }),
          {},
        ),
      ),
    },
    { params: { sheet } },
  )
}

async function run() {
  const date = format(new Date(), 'yyyy-mm-dd_HH-MM.ss')
  const content: string = await readFile(join(__dirname, '../../run/urls.yml'), {
    encoding: 'utf-8',
  })
  const entries = load(content) as URL
  for await (const [provider, urls] of Object.entries(entries).filter(
    ([p]) => !p.startsWith('.'),
  )) {
    const sheet = `${provider} ${date}`
    await createSheet(sheet)
    let batchCount = 0
    let productCount = 0
    console.log(`[${provider}] ${urls.length} urls`)
    const batches = chunk(urls, 100)
    for await (const batch of batches) {
      batchCount++
      const name = `${provider}-${date}-batch${batchCount}`
      const reports: IOutputProduct[][] = []
      for await (const pageUrl of batch) {
        productCount++
        console.log(
          `[${provider}] url ${productCount}/${batch.length} of batch ${batchCount}/${batches.length}`,
        )
        const report = await handler(
          // @ts-ignore
          makeMessage({ extractors: [provider], pageUrl }),
          makeContext(),
        )
        // @ts-ignore
        const products: IOutputProduct[] = report
          .flat()
          .flatMap(extractor => extractor.extractorResults)
          .flatMap(result => result.products || [])
          .map(product => ({ ...product, metadata: {} }))
        reports.push(products)
        if (productCount < 10000 && products.length) await appendProducts(sheet, products)
      }
      await writeFile(join(__dirname, `../../run/${name}.json`), JSON.stringify(reports))
    }
  }
}

run()
  .then((result: any) => console.log(result))
  .catch((error: Error) => console.error(error))
  .finally(() => process.exit())

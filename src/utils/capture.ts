import type { Page } from 'puppeteer'
import { join } from 'path'
import * as uuid from 'uuid'

export default async function screenPage(page: Page): Promise<string> {
  await page.screenshot({ path: join(__dirname, `../../run/${uuid.v1()}.png`) })
  // upload shot to s3
  // return s3 url
  return ''
}

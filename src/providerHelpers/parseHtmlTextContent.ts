import _ from 'lodash'
import { convert } from 'html-to-text'

/**
 * This fn takes an HTML and returns an array with all the lines converted to text, according to
 * html-to-text module.
 * In the future, we'll change this to improve bullets detection.
 * @param html - String with HTML to parse to text
 * @returns
 */
export function htmlToTextArray(html: string) {
  return (
    htmlToText(html)
      .split('\n')
      .map(e => e.trim())
      // .filter(e => e && e.match(/^\* /m))
      .filter(e => e !== '')
      .map(e =>
        e
          .replace(/^\* /, '')
          .replace(/\s\s/g, ' ')
          .replace(/\s+:(.)/, ':$1')
          .replace(/(.):(\S)/, '$1: $2'),
      )
  )
}

export default htmlToText

export function htmlToText(html: string) {
  return convert(html, {
    wordwrap: null,
    // baseElements: {
    //   selectors: ['ul', 'ol'],
    // },
  })
}

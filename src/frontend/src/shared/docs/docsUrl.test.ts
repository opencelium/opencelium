import { describe, expect, it } from 'vitest'
import { DOCS_BASE_URL, docsUrl } from './docsUrl'

describe('docsUrl', () => {
    it('builds the start page, a page and a section of a page', () => {
        expect(docsUrl('')).toBe(DOCS_BASE_URL)
        expect(docsUrl('guides/request-playground')).toBe(`${DOCS_BASE_URL}guides/request-playground.html`)
        expect(docsUrl('guides/request-playground', 'guide-request-playground-curl'))
            .toBe(`${DOCS_BASE_URL}guides/request-playground.html#guide-request-playground-curl`)
    })
})

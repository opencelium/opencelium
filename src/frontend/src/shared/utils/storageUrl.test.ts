import { afterEach, describe, expect, it } from 'vitest'
import { runtimeConfig } from '@shared/config/runtimeConfig'
import { resolveStorageUrl } from '@shared/utils/storageUrl'

const originalApiUrl = runtimeConfig.apiUrl

describe('resolveStorageUrl', () => {
    afterEach(() => {
        runtimeConfig.apiUrl = originalApiUrl
    })

    it('prefixes a storage path with the runtime API base', () => {
        runtimeConfig.apiUrl = 'https://oc.example.com/api'
        expect(resolveStorageUrl('./storage/files/logo.png'))
            .toBe('https://oc.example.com/api/storage/files/logo.png')
        expect(resolveStorageUrl('storage/files/logo.png'))
            .toBe('https://oc.example.com/api/storage/files/logo.png')
    })

    it('does not double the separator when the API base ends in a slash', () => {
        runtimeConfig.apiUrl = 'https://oc.example.com/api/'
        expect(resolveStorageUrl('./storage/files/logo.png'))
            .toBe('https://oc.example.com/api/storage/files/logo.png')
    })

    it('returns already-loadable values untouched', () => {
        runtimeConfig.apiUrl = 'https://oc.example.com/api'
        expect(resolveStorageUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc')
        expect(resolveStorageUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
        expect(resolveStorageUrl('https://cdn.example.com/logo.png'))
            .toBe('https://cdn.example.com/logo.png')
    })

    it('leaves a non-storage path alone', () => {
        expect(resolveStorageUrl('invoker.png')).toBe('invoker.png')
    })

    it('treats blank and missing values as no path', () => {
        expect(resolveStorageUrl('   ')).toBeNull()
        expect(resolveStorageUrl(null)).toBeNull()
        expect(resolveStorageUrl(undefined)).toBeNull()
    })
})

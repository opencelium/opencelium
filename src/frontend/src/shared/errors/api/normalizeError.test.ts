import { describe, expect, it } from 'vitest'
import { normalizeError } from './normalizeError'

describe('normalizeError', () => {
    it('keeps the message a JSON error body carries, whatever the status', () => {
        expect(normalizeError({ status: 400, data: { message: 'Name is already taken' } }))
            .toMatchObject({ type: 'VALIDATION', messageKey: 'validation', serverMessage: 'Name is already taken' })
        expect(normalizeError({ status: 404, data: { message: 'Connector 7 does not exist' } }))
            .toMatchObject({ type: 'NOT_FOUND', serverMessage: 'Connector 7 does not exist' })
        expect(normalizeError({ status: 418, data: { message: 'I am a teapot' } }))
            .toMatchObject({ type: 'UNKNOWN', serverMessage: 'I am a teapot' })
    })

    it('falls back to the error code, then to a plain-text body', () => {
        expect(normalizeError({ status: 400, data: { error: 'INVALID_DATA' } }).serverMessage)
            .toBe('INVALID_DATA')
        expect(normalizeError({ status: 502, data: 'Bad Gateway' }).serverMessage).toBe('Bad Gateway')
    })

    it('leaves serverMessage unset when the response explained nothing', () => {
        expect(normalizeError({ status: 404 }).serverMessage).toBeUndefined()
        expect(normalizeError({ status: 400, data: { message: '   ' } }).serverMessage).toBeUndefined()
    })

    it('caps a runaway body so the toast cannot become a wall of text', () => {
        const serverMessage = normalizeError({ status: 500, data: 'x'.repeat(1000) }).serverMessage
        expect(serverMessage).toHaveLength(301)
        expect(serverMessage?.endsWith('…')).toBe(true)
    })

    it('still lets a 500 message act as a translation key, since backend codes arrive that way', () => {
        expect(normalizeError({ status: 500, data: { message: 'CATEGORY_NOT_FOUND' } }))
            .toMatchObject({ type: 'SERVER', messageKey: 'CATEGORY_NOT_FOUND', serverMessage: 'CATEGORY_NOT_FOUND' })
        expect(normalizeError({ status: 500, data: {} }).messageKey).toBe('unknown')
    })
})

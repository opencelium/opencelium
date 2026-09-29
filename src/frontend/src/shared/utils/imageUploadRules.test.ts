import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_UPLOAD_BYTES, validateImageUpload } from '@shared/utils/imageUploadRules'

const fileOf = (name: string, size = 1) => {
    const file = new File(['x'], name)
    Object.defineProperty(file, 'size', { value: size })
    return file
}

describe('validateImageUpload', () => {
    it.each(['logo.png', 'logo.jpg', 'logo.jpeg', 'LOGO.JPEG'])('accepts %s', (name) => {
        expect(validateImageUpload(fileOf(name))).toBeNull()
    })

    it.each(['logo.svg', 'logo.gif', 'logo.webp', 'logo', 'logo.png.txt'])('rejects %s as invalidType', (name) => {
        expect(validateImageUpload(fileOf(name))).toBe('invalidType')
    })

    it('accepts a file of exactly 10 MB', () => {
        expect(validateImageUpload(fileOf('logo.png', MAX_IMAGE_UPLOAD_BYTES))).toBeNull()
    })

    it('rejects a file above 10 MB as tooLarge', () => {
        expect(validateImageUpload(fileOf('logo.png', MAX_IMAGE_UPLOAD_BYTES + 1))).toBe('tooLarge')
    })
})

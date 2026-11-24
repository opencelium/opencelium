import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PickerItem } from '../../model/types'
import { GlobalTextPreview } from './GlobalTextPreview'

const items: PickerItem[] = [
    { kind: 'CONSTANT', name: 'baseUrl', description: '', secret: false, valuePreview: '"https://api.example.com"' },
    { kind: 'CONSTANT', name: 'apiKey', description: '', secret: true, valuePreview: null },
    { kind: 'MUTABLE', name: 'lastSync', description: '', secret: false, valuePreview: '5', ownerWorkflow: null, writable: false },
]

// Provider-free stand-ins: the real primitives need SystemProvider and are not what is tested.
vi.mock('@shared/ui/primitives/Tooltip', () => ({ Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</> }))
vi.mock('@shared/ui/primitives/Icon', () => ({ Icon: () => null }))
vi.mock('./globalPicker', () => ({ useGlobalVariablePicker: () => ({ items, isLoading: false }) }))
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const chipTexts = () => screen.getAllByTestId('global-reference-chip').map((chip) => chip.textContent)

describe('GlobalTextPreview', () => {
    it('shows a constant by its value, a secret masked and a mutable variable by its name', () => {
        render(<GlobalTextPreview text="{{global.baseUrl}}/v1?key={{global.apiKey}}&since={{global.lastSync}}" />)
        expect(chipTexts()).toEqual(['https://api.example.com', '••••', 'lastSync'])
        expect(screen.getByText('/v1?key=')).toBeTruthy()
    })

    it('masks the plain text of a password field and keeps constants by name there', () => {
        render(<GlobalTextPreview text="ab{{global.baseUrl}}" isMasked />)
        expect(screen.getByText('••')).toBeTruthy()
        expect(chipTexts()).toEqual(['baseUrl'])
    })
})

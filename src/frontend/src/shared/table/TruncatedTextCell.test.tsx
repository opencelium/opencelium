import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import SystemContext from '@shared/theme/context/SystemContext'
import { TruncatedTextCell } from './TruncatedTextCell'

// A truncated cell renders a Tooltip, which resolves its Ant/Material implementation
// through this context — so every render here needs a kit picked.
const withKit = (ui: ReactNode) =>
    render(
        <SystemContext.Provider value={{ system: 'ant', setSystem: () => {} }}>
            {ui}
        </SystemContext.Provider>,
    )

// The shape that forced the System Check table to scroll sideways: a sentence with an
// unbreakable URL in it, longer than the shared 150-character cell cap.
const SMTP_ERROR =
    '535-5.7.8 Username and Password not accepted. For more information, go to 535 5.7.8 ' +
    'https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d'

describe('TruncatedTextCell', () => {
    it('wraps instead of forcing the table onto one line', () => {
        const { container } = withKit(<TruncatedTextCell value="a short note" />)
        expect(container.querySelector('div')).toHaveStyle({ whiteSpace: 'normal' })
    })

    it('only breaks inside words when asked', () => {
        const { container: plain } = withKit(<TruncatedTextCell value={SMTP_ERROR} />)
        expect(plain.querySelector('div')?.style.overflowWrap).toBe('')

        const { container: breaking } = withKit(
            <TruncatedTextCell value={SMTP_ERROR} breakAnywhere />,
        )
        // `anywhere`, not `break-word`: only this one shrinks min-content width, which
        // is what lets the column narrow past the embedded URL.
        expect(breaking.querySelector('div')?.style.overflowWrap).toBe('anywhere')
    })

    it('still truncates the text it renders', () => {
        const { container } = withKit(<TruncatedTextCell value={SMTP_ERROR} breakAnywhere />)
        const rendered = container.querySelector('div')?.textContent ?? ''
        expect(rendered.length).toBeLessThan(SMTP_ERROR.length)
        expect(rendered.endsWith('…')).toBe(true)
    })

    it('renders nothing for a non-string or empty value', () => {
        expect(withKit(<TruncatedTextCell value={null} />).container).toBeEmptyDOMElement()
        expect(withKit(<TruncatedTextCell value="" />).container).toBeEmptyDOMElement()
    })
})

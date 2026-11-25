import type { SVGProps } from 'react'

// A small copy of the global variable wizard image (`assets/images/wizard/global-variable.svg`); no icon set has braces around a globe.
export function GlobalVariableGlyph(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M5.5 4c-1.5 0-2 .75-2 2v3.5c0 1-.5 2.5-2 2.5 1.5 0 2 1.5 2 2.5V18c0 1.25.5 2 2 2" />
            <path d="M18.5 4c1.5 0 2 .75 2 2v3.5c0 1 .5 2.5 2 2.5-1.5 0-2 1.5-2 2.5V18c0 1.25-.5 2-2 2" />
            <circle cx="12" cy="12" r="5" />
            <path d="M7 12h10" />
            <path d="M12 7c-1.6 1.4-2.2 3.2-2.2 5s.6 3.6 2.2 5c1.6-1.4 2.2-3.2 2.2-5S13.6 8.4 12 7z" />
        </svg>
    )
}

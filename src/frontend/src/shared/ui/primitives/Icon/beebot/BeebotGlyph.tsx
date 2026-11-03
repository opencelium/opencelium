import type { BeebotState } from '../Icon.types'
import './beebotGlyph.css'

type Props = {
    state: BeebotState
    size?: number
    className?: string
    onClick?: () => void
}

/**
 * The Beebot voice assistant's glyph. One `<svg>` for every state, so a state change animates (CSS transitions)
 * instead of remounting. Decorative: the control around it names the state for assistive technology.
 * The wing groups carry the CSS transforms while the ellipses inside keep their own `transform` attribute; merging
 * them would let the CSS transform override the attribute.
 */
export function BeebotGlyph({ state, size = 20, className, onClick }: Props) {
    return (
        <svg className={`bb ${state}${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 24 24"
            aria-hidden="true" focusable="false" onClick={onClick} xmlns="http://www.w3.org/2000/svg">
            <circle className="glow" cx="12" cy="12" r="11" />
            <g className="bee">
                <g className="wing-l"><ellipse className="wing" cx="5.6" cy="10.2" rx="3.4" ry="2.2" transform="rotate(-28 5.6 10.2)" /></g>
                <g className="wing-r"><ellipse className="wing" cx="18.4" cy="10.2" rx="3.4" ry="2.2" transform="rotate(28 18.4 10.2)" /></g>
                <path className="ant" d="M10.6 8.9L9.3 5.3M13.4 8.9L14.7 5.3" />
                <circle className="tip tip-l" cx="8.9" cy="4.3" r="1.15" />
                <circle className="tip tip-r" cx="15.1" cy="4.3" r="1.15" />
                <path className="wave w1" d="M6.54 3.88A2.4 2.4 0 0 1 8.48 1.94M17.46 3.88A2.4 2.4 0 0 0 15.52 1.94" />
                <path className="wave w2" d="M5.36 3.68A3.6 3.6 0 0 1 8.28 0.76M18.64 3.68A3.6 3.6 0 0 0 15.72 0.76" />
                <ellipse className="body" cx="12" cy="14.5" rx="5" ry="6" />
                <g className="eyes">
                    <circle className="eye" cx="10.2" cy="11.4" r="0.95" />
                    <circle className="eye" cx="13.8" cy="11.4" r="0.95" />
                </g>
                <path className="eye-off" d="M9.4 11.6h1.6M13 11.6h1.6" />
                <path className="stripe" d="M8.6 14.6h6.8M9.3 17.6h5.4" />
            </g>
        </svg>
    )
}

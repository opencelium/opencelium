import { Trans } from 'react-i18next'

export const AsciiError = () => (
    <Trans i18nKey="masterPassword.error.nonAsciiError" ns="widget">
        Password contains
        <a
            href="https://terpconnect.umd.edu/~zben/Web/CharSet/htmlchars.html"
            target="_blank"
            rel="noopener noreferrer"
        >
            non-ASCII
        </a>{' '}
        characters!
    </Trans>
)

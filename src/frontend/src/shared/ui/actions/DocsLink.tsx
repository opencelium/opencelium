import type { ReactNode } from 'react'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { docsUrl, openDocs, type DocsPage } from '@shared/docs/docsUrl'
import './docsLink.css'

type DocsLinkProps = {
    page: DocsPage
    anchor?: string
    testId: string
    /** Text next to the docs icon; without it the link is an icon button with a tooltip. */
    children?: ReactNode
    /** `inherit` takes the surrounding text colour, for a link on a tooltip's dark background. */
    tone?: 'primary' | 'inherit'
}

/**
 * Opens a page of the OpenCelium documentation in a new tab. Clicks don't reach the parent,
 * so the link can sit in a clickable header, a collapse label or a form label.
 */
export function DocsLink({ page, anchor, testId, children, tone = 'primary' }: DocsLinkProps) {
    const { t } = useI18n('common')
    if (children) {
        return (
            <a
                className={`docs-link docs-link--${tone}`}
                href={docsUrl(page, anchor)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={testId}
                onClick={(event) => event.stopPropagation()}
            >
                <Icon name="docs" size={14} color="inherit" />
                {children}
            </a>
        )
    }
    return (
        // Inline wrapper: the Tooltip's own wrapper is a block-level flex box, which would break the line.
        <span className="docs-link__icon" onClick={(event) => event.stopPropagation()}>
            <Tooltip content={t('docs.tooltip')}>
                <IconButton
                    type="text"
                    size="xs"
                    iconProps={{ name: 'docs', size: 14, color: 'primary' }}
                    ariaLabel={t('docs.tooltip')}
                    testId={testId}
                    onClick={() => openDocs(page, anchor)}
                />
            </Tooltip>
        </span>
    )
}

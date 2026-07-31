import React, { useEffect, useState } from 'react'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'

type Props = {
    changelogLink: string
}

export function ChangelogDialogContent({ changelogLink }: Props) {
    const { t } = useI18n('entities')
    const [content, setContent] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)
        setHasError(false)
        setContent(null)

        apiExecutor({ url: changelogLink, method: 'GET', options: { responseType: 'arraybuffer', ignoreError: true } })
            .then((text: string) => {
                if (!cancelled) {
                    setContent(text)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setHasError(true)
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [changelogLink])

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loading size="md" />
            </div>
        )
    }

    if (hasError) {
        return (
            <div style={{ color: 'var(--color-text-secondary)', padding: 16 }}>
                {t('update-assistant.changelog.error')}
            </div>
        )
    }

    return (
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <pre
                style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                    padding: 0,
                }}
            >
                {content}
            </pre>
        </div>
    )
}

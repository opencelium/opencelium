import React, { useMemo, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { Typography } from '@shared/ui/primitives/Typography'
import { Icon } from '@shared/ui/primitives/Icon'
import { Input } from '@shared/ui/primitives/Input'
import { Empty } from '@shared/ui/primitives/Empty'
import { buildTestId } from '@shared/testing/testId'
import { getDynamicCommandTree } from '@shared/command/tree'
import { useCommandPolicyContext } from '@shared/command/useCommandPolicyContext'
import { buildCommandReference } from '@shared/command/help/buildCommandReference'
import { orderGroups } from '@shared/command/groupOrder'

const SHORTCUTS: { keys: string[]; labelKey: string }[] = [
    { keys: ['Ctrl', 'K'], labelKey: 'commandPalette.help.shortcuts.open' },
    { keys: ['↑', '↓'], labelKey: 'commandPalette.footer.navigate' },
    { keys: ['↵'], labelKey: 'commandPalette.footer.select' },
    { keys: ['Tab'], labelKey: 'commandPalette.footer.autocomplete' },
    { keys: ['⌫'], labelKey: 'commandPalette.help.shortcuts.clearScope' },
    { keys: ['Esc'], labelKey: 'commandPalette.footer.close' },
]

// Content for the "help" system command — opened via ctx.openModal, so the
// surrounding antd Modal already provides the backdrop/close affordance.
export const CommandReferenceDialog: React.FC = () => {
    const { t } = useI18n('common')
    const { theme } = useTheme()
    const policyContext = useCommandPolicyContext()
    const [query, setQuery] = useState('')

    const groups = useMemo(() => {
        const built = buildCommandReference(getDynamicCommandTree(), policyContext)
        const byGroup = new Map(built.map((g) => [g.group, g]))
        return orderGroups(built.map((g) => g.group)).map((key) => byGroup.get(key)!)
    }, [policyContext])

    const visibleGroups = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return groups
        return groups
            .map((g) => ({
                group: g.group,
                entries: g.entries.filter((entry) => {
                    const description = entry.description ? t(entry.description as never) : ''
                    return entry.phrase.toLowerCase().includes(needle) || description.toLowerCase().includes(needle)
                }),
            }))
            .filter((g) => g.entries.length > 0)
    }, [groups, query, t])

    const kbdStyle: React.CSSProperties = {
        padding: '3px 8px',
        borderRadius: 6,
        border: `1px solid ${theme.color.border.strong}`,
        background: theme.color.background.elevated,
        color: theme.color.text.secondary,
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.mono,
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: 16 }}>
                <span
                    style={{
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: theme.color.background.surface,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name="help" size={20} color="primary" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="title" as="h2">
                        {t('commandPalette.help.title')}
                    </Typography>
                    <div style={{ marginTop: 3 }}>
                        <Typography variant="body" isSubtle>
                            {t('commandPalette.help.subtitle')}
                        </Typography>
                    </div>
                </div>
            </div>

            {groups.length > 0 && (
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('commandPalette.help.searchPlaceholder')}
                    leftSlot={<Icon name="search" size={16} isSubtle />}
                    testId={buildTestId('command-reference', 'search')}
                />
            )}

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4, marginTop: 12 }}>
                {groups.length === 0 ? (
                    <Empty description={t('commandPalette.help.empty')} />
                ) : visibleGroups.length === 0 ? (
                    <Empty description={t('commandPalette.help.noResults', { query })} />
                ) : (
                    visibleGroups.map((g) => (
                        <div key={g.group} style={{ paddingTop: 20 }}>
                            <Typography variant="section-label" isBold isUppercase>
                                {t(`commandPalette.groups.${g.group}` as never)}
                            </Typography>
                            <div
                                style={{
                                    border: `1px solid ${theme.color.border.subtle}`,
                                    borderRadius: 11,
                                    marginTop: 8,
                                    overflow: 'hidden',
                                }}
                            >
                                {g.entries.map((entry, i) => (
                                    <div
                                        key={entry.phrase}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: '10px 14px',
                                            borderTop: i > 0 ? `1px solid ${theme.color.border.subtle}` : undefined,
                                        }}
                                    >
                                        <code
                                            style={{
                                                flexShrink: 0,
                                                fontFamily: theme.typography.fontFamily.mono,
                                                fontSize: 13,
                                                color: theme.color.text.primary,
                                                background: theme.color.background.elevated,
                                                border: `1px solid ${theme.color.border.subtle}`,
                                                borderRadius: 6,
                                                padding: '3px 9px',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {entry.phrase}
                                        </code>
                                        {entry.description && (
                                            <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: theme.color.text.secondary }}>
                                                {t(entry.description as never)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                <div style={{ paddingTop: 26 }}>
                    <Typography variant="section-label" isBold isUppercase>
                        {t('commandPalette.help.keyboardTitle')}
                    </Typography>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginTop: 8 }}>
                        {SHORTCUTS.map((sc) => (
                            <div key={sc.labelKey} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
                                    {sc.keys.map((k) => (
                                        <kbd key={k} style={kbdStyle}>{k}</kbd>
                                    ))}
                                </span>
                                <Typography variant="caption" isSubtle>
                                    {t(sc.labelKey as never)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { Radio } from '@shared/ui/primitives/Radio'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl'

type IconChoice = 'leave' | 'delete' | 'new'

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

/**
 * Icon field for the connector wizard. On update, when the connector already has
 * an icon, it offers three choices: leave the current icon, delete it, or set a
 * new one. "Leave" keeps the saved icon string (omitted on save, server keeps it),
 * "delete" sets the form value to null (server clears it), and "new" reveals the
 * dropzone so a fresh File can be picked. On create (no existing icon) the field
 * falls back to the plain dropzone.
 */
export function ConnectorIconField({ field, mode, defaultRender }: FieldOverrideProps) {
    const { setValue } = useFormContext()
    const { t } = useI18n('entities')

    // The form is populated by `form.reset(initialValues)` in EntityWizard's effect,
    // which runs after the first render — so we can't snapshot the icon at mount.
    // Watch the value and lock in the saved icon the first time a string appears,
    // so switching back to "leave" can restore it without a refetch.
    const value = useWatch({ name: field.name })
    const originalIconRef = useRef<string | null>(null)
    if (originalIconRef.current === null && isNonEmptyString(value)) {
        originalIconRef.current = value
    }
    const originalIcon = originalIconRef.current
    const [choice, setChoice] = useState<IconChoice>('leave')

    const hasOriginal = mode === 'update' && originalIcon !== null
    const previewUrl = hasOriginal ? resolveConnectorIconUrl(originalIcon) : null

    const handleChoice = (next: IconChoice) => {
        setChoice(next)
        // "leave" restores the saved icon; "delete" and "new" both clear it (a fresh
        // File from the dropzone overwrites null once the user picks one).
        setValue(field.name, next === 'leave' ? originalIcon : null, { shouldDirty: true })
    }

    if (!hasOriginal) return <>{defaultRender()}</>

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt=""
                        style={{
                            width: 48,
                            height: 48,
                            objectFit: 'contain',
                            borderRadius: 8,
                            background: 'var(--color-bg-elevated, #fff)',
                            opacity: choice === 'delete' ? 0.4 : 1,
                        }}
                    />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Radio
                        name="connector-icon-choice"
                        value="leave"
                        checked={choice === 'leave'}
                        onChange={() => handleChoice('leave')}
                        label={t('connector.fields.icon.options.leave')}
                        testId="connector-icon-choice-leave"
                    />
                    <Radio
                        name="connector-icon-choice"
                        value="delete"
                        checked={choice === 'delete'}
                        onChange={() => handleChoice('delete')}
                        label={t('connector.fields.icon.options.delete')}
                        testId="connector-icon-choice-delete"
                    />
                    <Radio
                        name="connector-icon-choice"
                        value="new"
                        checked={choice === 'new'}
                        onChange={() => handleChoice('new')}
                        label={t('connector.fields.icon.options.new')}
                        testId="connector-icon-choice-new"
                    />
                </div>
            </div>
            {choice === 'new' && defaultRender()}
        </div>
    )
}

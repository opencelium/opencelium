import { Controller, useFormContext } from 'react-hook-form'
import { Radio } from '@shared/ui/primitives/Radio'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { EntityText } from '@shared/ui/primitives/Text'

export function UserTitleField({ readOnly }: { readOnly?: boolean }) {
    const { control } = useFormContext()
    const { t } = useI18n('entities')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <EntityText i18nKey="profile.fields.userTitle.label" typoProps={{ isBold: true }} />
            <Controller
                control={control}
                name="userTitle"
                render={({ field }) => (
                    <div style={{ display: 'flex', gap: 24 }}>
                        <Radio
                            name="userTitle"
                            value="mr"
                            checked={field.value === 'mr'}
                            disabled={readOnly}
                            onChange={() => field.onChange('mr')}
                            label={t('profile.fields.userTitle.options.mr')}
                        />
                        <Radio
                            name="userTitle"
                            value="mrs"
                            checked={field.value === 'mrs'}
                            disabled={readOnly}
                            onChange={() => field.onChange('mrs')}
                            label={t('profile.fields.userTitle.options.mrs')}
                        />
                    </div>
                )}
            />
        </div>
    )
}

import type {FieldOverrideProps} from '@/engine/entity/overrides/types'
import {useGravatarSuggestion} from '@entities/user/ui/useGravatarSuggestion'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {DocsLink} from '@shared/ui/actions/DocsLink'

// One grid cell for the field and its docs link; React's onBlur still bubbles up from the input inside.
export function UserEmailField({field, mode, defaultRender}: FieldOverrideProps) {
    const {t} = useI18n('entities')
    const {handleBlur} = useGravatarSuggestion({emailField: field.name, mode})
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0}} onBlur={() => void handleBlur()}>
            {defaultRender()}
            {mode !== 'view' && (
                <DocsLink page="guides/users-and-permissions" anchor="signing-in" testId="user-sign-in-docs">
                    {t('user.docs.signIn')}
                </DocsLink>
            )}
        </div>
    )
}

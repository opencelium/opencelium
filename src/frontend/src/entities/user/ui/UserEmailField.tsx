import type {FieldOverrideProps} from '@/engine/entity/overrides/types'
import {useGravatarSuggestion} from '@entities/user/ui/useGravatarSuggestion'

// `display: contents` keeps the wrapper out of the section grid; React's onBlur still
// bubbles up from the input rendered inside.
export function UserEmailField({field, mode, defaultRender}: FieldOverrideProps) {
    const {handleBlur} = useGravatarSuggestion({emailField: field.name, mode})
    return (
        <div style={{display: 'contents'}} onBlur={() => void handleBlur()}>
            {defaultRender()}
        </div>
    )
}

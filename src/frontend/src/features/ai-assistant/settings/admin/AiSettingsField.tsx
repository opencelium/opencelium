import type { ReactNode } from 'react'

type Props = {
    label: ReactNode
    hint?: ReactNode
    /** Already translated. */
    error?: string
    children: ReactNode
}

/** One labelled control of the admin settings, with its hint or its error under it. */
export function AiSettingsField({ label, hint, error, children }: Props) {
    return (
        <label className="aiSettingsField">
            <span className="aiSettingsFieldLabel">{label}</span>
            <span className="aiSettingsFieldControl">{children}</span>
            {error
                ? <span className="aiSettingsFieldError" role="alert">{error}</span>
                : hint && <span className="aiSettingsNote">{hint}</span>}
        </label>
    )
}

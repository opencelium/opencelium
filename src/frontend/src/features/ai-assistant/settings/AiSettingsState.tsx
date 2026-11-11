import { Icon } from '@shared/ui/primitives/Icon'

/** Available / not available with its icon, so the state does not rest on colour alone. */
export function AiSettingsState({ isOk, label }: { isOk: boolean; label: string }) {
    return (
        <span className="aiSettingsState">
            <Icon name={isOk ? 'check-circle' : 'warning'} size={14} color={isOk ? 'primary' : 'danger'} />
            {label}
        </span>
    )
}

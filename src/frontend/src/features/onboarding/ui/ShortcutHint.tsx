import { Fragment } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { usePaletteKeyLabel } from './usePaletteKeyLabel'
import './onboardingCode.css'

/** `mod` is the platform's command modifier — ⌘ on macOS, Ctrl/Strg elsewhere. */
export type ShortcutKey = 'mod' | 'shift' | string

export type Shortcut = {
    /** Alternative combinations for the same action, e.g. ⌘+Shift+Z or ⌘+Y for redo. */
    combos: ShortcutKey[][]
    /** Resolved against the `workflow` namespace, so it reads as the editor names it. */
    labelKey: string
}

/**
 * A keyboard shortcut in the same keycaps as CommandHint, e.g. `⌘ + Z  Undo`.
 * Shares its row class, so a shortcut and a palette command read as one family.
 */
export function ShortcutHint({ combos, labelKey }: Shortcut) {
    const { t: tWorkflow } = useI18n('workflow')
    const modLabel = usePaletteKeyLabel()
    const keyLabel = (key: ShortcutKey) => {
        if (key === 'mod') return modLabel
        if (key === 'shift') return tWorkflow('shortcutsDialog.keys.shift')
        return key.toUpperCase()
    }

    return (
        <span className="onboarding-command-note">
            {combos.map((combo, comboIndex) => (
                <Fragment key={combo.join('+')}>
                    {comboIndex > 0 && <span aria-hidden>/</span>}
                    {combo.map((key, keyIndex) => (
                        <Fragment key={key}>
                            {keyIndex > 0 && <span aria-hidden>+</span>}
                            <kbd>{keyLabel(key)}</kbd>
                        </Fragment>
                    ))}
                </Fragment>
            ))}
            <span>{tWorkflow(labelKey)}</span>
        </span>
    )
}

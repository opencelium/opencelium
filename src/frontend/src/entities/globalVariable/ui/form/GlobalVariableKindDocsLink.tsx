import { DocsLink } from '@shared/ui/actions/DocsLink'
import { EntityText } from '@shared/ui/primitives/Text'
import type { GlobalVariableKind } from '../../model/types'

const KIND_DOCS: Record<GlobalVariableKind, { anchor: string; labelKey: 'global-variable.docs.constant' | 'global-variable.docs.mutable' | 'global-variable.docs.script' }> = {
    CONSTANT: { anchor: 'how-the-value-is-typed', labelKey: 'global-variable.docs.constant' },
    MUTABLE: { anchor: 'let-a-run-update-a-mutable-variable', labelKey: 'global-variable.docs.mutable' },
    SCRIPT: { anchor: 'script-variables', labelKey: 'global-variable.docs.script' },
}

/** The docs section for the kind being edited, at the top right of the "Value or code" step. */
export function GlobalVariableKindDocsLink({ kind }: { kind: GlobalVariableKind }) {
    const { anchor, labelKey } = KIND_DOCS[kind]
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <DocsLink page="guides/global-variables" anchor={anchor} testId={`global-variable-${kind.toLowerCase()}-docs`}>
                <EntityText i18nKey={labelKey} />
            </DocsLink>
        </div>
    )
}

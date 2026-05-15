import React from 'react'
import type {
    SectionDefinition,
    EntityDefinition,
    Mode,
    FieldDefinition
} from '../EntityDefinition'
import { overrideRegistry } from '../overrides/overrideRegistry'
import { FieldRenderer } from './FieldRenderer'
import {usePolicyContext} from "@/engine/policy/PolicyReactContext.tsx";
import {policyEngine} from "@/engine/policy";

type Props = {
    section: SectionDefinition
    entity: EntityDefinition
    mode: Mode
    forcedReadonly?: boolean
}

export function SectionRenderer({
    section,
    entity,
    mode,
    forcedReadonly
}: Props) {

    const policyContext = usePolicyContext()

    const decision = policyEngine.evaluate(
        section.access,
        {
            ...policyContext,
            resource: `section:${section.id}`
        }
    )

    if (!decision.allowed) {
        if (decision.strategy === 'hide') {
            return null
        }

        if (decision.strategy === 'forbid') {
            return <span>{`Access denied to section "${section.id}"`}</span>
        }
    }

    const readOnly =
        mode === 'view' ||
        (!decision.allowed && decision.strategy === 'disable')

    /* ===============================
       Find fields that belong to the section
    ============================== */

    const fields: FieldDefinition[] =
        entity.fields.filter(field =>
            section.fields.includes(field.name)
        )

    /* ===============================
       Default render (Enhance Strategy)
    ============================== */

    const defaultRender = () => (
        <div style={{ marginBottom: 32, display: 'grid' }}>


            {fields.map(field => (
                <FieldRenderer
                    key={field.name}
                    field={field}
                    mode={mode}
                    forcedReadOnly={readOnly || forcedReadonly}
                />
            ))}

        </div>
    )

    /* ===============================
       Override Support
    ============================== */

    const SectionOverride =
        overrideRegistry.getSection(section.overrideKey)

    if (SectionOverride) {
        return (
            <SectionOverride
                section={section}
                fields={fields}
                mode={mode}
                defaultRender={defaultRender}
                readOnly={readOnly || forcedReadonly}
            />
        )
    }

    return defaultRender()
}

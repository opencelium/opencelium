import React from 'react'
import type { SectionOverrideProps } from '@/engine/entity/overrides/types'
import { overrideRegistry } from '@/engine/entity/overrides/overrideRegistry'

const CredentialsSectionOverride: React.FC<SectionOverrideProps> = ({
    section,
    fields,
    mode,
    defaultRender
}) => {

    return (
        <div
            style={{
                border: '1px solid var(--color-border-default)',
                padding: 20,
                borderRadius: 8,
                marginBottom: 20,
                background: 'var(--color-background-hover)'
            }}
        >
            <h3 style={{ marginBottom: 16 }}>
                🔐 {section.title ?? 'Credentials'}
            </h3>

            {/* example of a custom layout */}
            <div style={{ display: 'flex', gap: 16 }}>
                {fields.map(field => (
                    <div key={field.name} style={{ flex: 1 }}>
                        {/* call the default render via defaultRender?
                No — this is a section override, so
                we need to render the field through the engine */}
                        {defaultRender()}
                    </div>
                ))}
            </div>
        </div>
    )
}

overrideRegistry.registerSection(
    'credentialsSection',
    CredentialsSectionOverride
)

export default CredentialsSectionOverride

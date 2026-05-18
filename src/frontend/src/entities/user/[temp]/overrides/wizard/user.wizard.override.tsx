import React, { useState } from 'react'
import type { WizardOverrideProps } from '@/engine/entity/overrides/types'
import { overrideRegistry } from '@/engine/entity/overrides/overrideRegistry'
import { EntityForm } from '@/engine/entity/runtime/EntityForm'

const UserWizardOverride: React.FC<WizardOverrideProps> = ({
    entity,
    mode,
    defaultRender
}) => {

    const [step, setStep] = useState(0)

    const steps = [
        {
            title: 'Credentials',
            sectionIds: ['credentials']
        },
        {
            title: 'User Details',
            sectionIds: ['details']
        }
    ]

    const currentStep = steps[step]

    return (
        <div style={{ padding: 24 }}>

            <h2>{entity.name.toUpperCase()} Wizard</h2>

            <div style={{ marginBottom: 20 }}>
                Step {step + 1} / {steps.length} — {currentStep.title}
            </div>

            {/* Render only the required sections */}
            <EntityForm
                entity={{
                    ...entity,
                    sections: entity.sections?.filter(s =>
                        currentStep.sectionIds.includes(s.id)
                    )
                }}
                mode={mode}
                onSubmit={(data) => {
                    if (step < steps.length - 1) {
                        setStep(prev => prev + 1)
                    } else {
                        console.log('Final submit', data)
                    }
                }}
            />

            <div style={{ marginTop: 20 }}>
                {step > 0 && (
                    <button onClick={() => setStep(prev => prev - 1)}>
                        Back
                    </button>
                )}
            </div>
        </div>
    )
}

overrideRegistry.registerWizard(
    'userWizard',
    UserWizardOverride
)

export default UserWizardOverride

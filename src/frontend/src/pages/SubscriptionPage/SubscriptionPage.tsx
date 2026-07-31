import React, { useCallback, useRef, useState } from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { Steps } from '@shared/ui/primitives/Steps'
import { StepHeader } from '@shared/ui/step-form/StepHeader'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useBreakpoints } from '@app/hooks/useBreakpoints'
import { LicenseInformationStep } from '@pages/SubscriptionPage/LicenseInformationStep'
import { OperationUsageStep } from '@pages/SubscriptionPage/OperationUsageStep'
import { OperationDetailsStep } from '@pages/SubscriptionPage/OperationDetailsStep'
import subscriptionWizardImage from '@assets/images/wizard/subscription.gif'

type StepIndex = 0 | 1 | 2

export function SubscriptionPage() {
    const { t } = useI18n('entities')
    const { isTabletOrMobile } = useBreakpoints()
    const headerRef = useRef(null)
    const [currentStep, setCurrentStep] = useState<StepIndex>(0)
    const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null)

    const handleSelectOperation = useCallback((id: number) => {
        setSelectedOperationId(id)
        setCurrentStep(2)
    }, [])

    const handleBack = useCallback(() => {
        setCurrentStep(1)
    }, [])

    const detailsStepStatus: 'wait' | 'process' | 'finish' =
        selectedOperationId === null
            ? 'wait'
            : currentStep === 2
              ? 'process'
              : 'finish'

    const stepItems = [
        {
            header: t('subscription.steps.license.header' as never),
            subheader: t('subscription.steps.license.subheader' as never),
            content: <LicenseInformationStep />,
            onClick: currentStep === 0 ? undefined : () => setCurrentStep(0),
        },
        {
            header: t('subscription.steps.operationUsage.header' as never),
            subheader: t('subscription.steps.operationUsage.subheader' as never),
            content: <OperationUsageStep onSelectOperation={handleSelectOperation} />,
            onClick: currentStep === 1 ? undefined : () => setCurrentStep(1),
        },
        {
            header: t('subscription.steps.operationDetails.header' as never),
            subheader: t('subscription.steps.operationDetails.subheader' as never),
            content:
                selectedOperationId !== null ? (
                    <OperationDetailsStep
                        operationId={selectedOperationId}
                        onBack={handleBack}
                    />
                ) : null,
            status: detailsStepStatus,
            onClick:
                selectedOperationId !== null && currentStep !== 2
                    ? () => setCurrentStep(2)
                    : undefined,
        },
    ]

    return (
        <PageWrapper>
            <div style={{ padding: 18 }}>
                <StepHeader
                    containerRef={headerRef}
                    header="subscription.wizard.header"
                    subheader="subscription.wizard.subheader"
                    image={subscriptionWizardImage}
                />

                <div
                    style={{
                        display: isTabletOrMobile ? 'grid' : 'flex',
                        gap: isTabletOrMobile ? 24 : 48,
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Steps
                            items={stepItems}
                            current={currentStep}
                            status="process"
                        />
                    </div>
                    <div style={{ flex: 3, minWidth: 0 }}>
                        {stepItems[currentStep]?.content}
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}

export default SubscriptionPage

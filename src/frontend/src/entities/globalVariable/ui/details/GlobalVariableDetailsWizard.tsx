import React from 'react'
import { useForm } from 'react-hook-form'
import globalVariableWizardImage from '@assets/images/wizard/global-variable.svg'
import { StepFormLayout } from '@shared/ui/step-form/StepFormLayout'
import type { StepDefinition } from '@shared/ui/step-form/types'
import { TestScopeProvider } from '@shared/testing/TestScopeContext'
import { Alert } from '@shared/ui/primitives/Alert'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useGetGlobalVariableQuery } from '../../api/globalVariableApi'
import { GlobalVariableOverview } from '../detail/GlobalVariableOverview'
import { GlobalVariableUsageTable } from '../detail/GlobalVariableUsageTable'
import { GlobalVariableChangeLog } from '../detail/GlobalVariableChangeLog'
import { GlobalVariableSharing } from '../detail/GlobalVariableSharing'

const stepKey = (step: string, part: 'header' | 'subheader' | 'description') => `global-variable.details.steps.${step}.${part}`

const Described: React.FC<{ step: string; children: React.ReactNode }> = ({ step, children }) => {
    const { t } = useI18n('entities')
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Typography variant="body" isSubtle>{t(stepKey(step, 'description'))}</Typography>
            {children}
        </div>
    )
}

/** Read-only wizard with what the form doesn't hold: bookkeeping, usages, change log and sharing. */
export const GlobalVariableDetailsWizard: React.FC<{ id: number }> = ({ id }) => {
    const { t } = useI18n('entities')
    const { user } = useAuth()
    const isAdmin = useIsAdmin()
    // StepFormLayout requires a form instance even when nothing is edited.
    const form = useForm()
    const { data: variable, isLoading, isError } = useGetGlobalVariableQuery(id, { skip: !Number.isFinite(id) })

    if (isLoading) return <Loading size="md" />
    if (isError || !variable) return <Alert type="error" message={t('global-variable.notFound')} showIcon />

    const canShare = isAdmin || user?.userId === variable.ownerUser.id
    const step = (key: string, render: () => React.ReactNode): StepDefinition => ({
        header: stepKey(key, 'header'),
        subheader: stepKey(key, 'subheader'),
        render,
    })
    const steps = [
        step('general', () => <Described step="general"><GlobalVariableOverview variable={variable} /></Described>),
        step('usage', () => <Described step="usage"><GlobalVariableUsageTable id={variable.id} /></Described>),
        step('changes', () => <Described step="changes"><GlobalVariableChangeLog variable={variable} /></Described>),
        ...(canShare ? [step('sharing', () => <Described step="sharing"><GlobalVariableSharing id={variable.id} /></Described>)] : []),
    ]

    return (
        <TestScopeProvider scope="global-variable-details">
            <div data-testid="global-variable-details">
                <StepFormLayout
                    header={variable.name}
                    subheader={variable.description ?? ''}
                    steps={steps}
                    image={globalVariableWizardImage}
                    form={form}
                    readOnly
                />
            </div>
        </TestScopeProvider>
    )
}

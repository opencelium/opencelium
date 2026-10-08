import { useEffect, useState } from 'react'
import { ONBOARDING_MILESTONES, ONBOARDING_RESTART_EVENT, ONBOARDING_STEP_ORDER, ONBOARDING_Z_INDEX, type OnboardingStatus, type OnboardingStepId } from '../model/types'
import './onboardingChecklist.css'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'

type ChecklistProps = {
    stepId: OnboardingStepId
    status: OnboardingStatus
    onResume: () => void
    onRestart: () => void
    onDismiss: () => void
    hasInvokers: boolean
}

type MilestoneId = (typeof ONBOARDING_MILESTONES)[number]['id']

function MilestoneIcon({ done, current }: { done: boolean; current: boolean }) {
    if (done) return <Icon name="check" size={13} color="inherit" />
    if (current) return <Icon name="circle" size={16} color="inherit" />
    return <Icon name="lock" size={13} color="inherit" />
}

export function OnboardingChecklist({ stepId, status, onResume, onRestart, onDismiss, hasInvokers }: ChecklistProps) {
    const { t } = useI18n('onboarding')
    const confirm = useConfirm()
    const [expanded, setExpanded] = useState(false)
    const currentStep = ONBOARDING_STEP_ORDER.indexOf(stepId)
    const isMilestoneDone = (id: MilestoneId) => {
        if (status === 'completed') return true
        if (id === 'invoker' && hasInvokers && currentStep >= ONBOARDING_STEP_ORDER.indexOf('invoker')) return true
        return ONBOARDING_STEP_ORDER.indexOf(id) < currentStep
    }
    const doneCount = ONBOARDING_MILESTONES.filter(item => isMilestoneDone(item.id)).length
    const currentMilestone = stepId === 'invoker-explainer' || stepId === 'invoker'
        ? 'invoker'
        : ONBOARDING_MILESTONES.some(item => item.id === stepId)
            ? stepId
            : undefined
    const progress = `${(doneCount / ONBOARDING_MILESTONES.length) * 100}%`
    // 'tour-complete' is a tour the user closed or skipped, not a finished one —
    // that is exactly the case where continuing beats restarting from scratch.
    const canContinue = status === 'paused' || status === 'tour-complete'
    const handleContinue = () => {
        setExpanded(false)
        onResume()
    }
    const handleRestart = () => {
        setExpanded(false)
        onRestart()
    }
    // Restart can also come from the command palette's "help onboarding", not just
    // this panel's own button — the pill collapses either way, so a restarted tour
    // is never fought over screen space by an already-open checklist.
    useEffect(() => {
        const collapse = () => setExpanded(false)
        window.addEventListener(ONBOARDING_RESTART_EVENT, collapse)
        return () => window.removeEventListener(ONBOARDING_RESTART_EVENT, collapse)
    }, [])
    const handleDismiss = async () => {
        const ok = await confirm({
            title: t('checklist.dismissTitle'),
            message: t('checklist.dismissBody'),
            confirmText: t('actions.hide'),
            cancelText: t('actions.keep'),
            confirmVariant: 'danger',
        })
        if (ok) onDismiss()
    }

    if (!expanded) {
        return (
            <div className={`onboarding-checklist-pill${status === 'paused' ? ' is-paused' : ''}`} style={{ zIndex: ONBOARDING_Z_INDEX.checklist }}>
                <Button color="default" variant="solid" onClick={() => setExpanded(true)} testId="onboarding-checklist-open">
                    {status === 'paused' ? t('checklist.paused') : t('checklist.pill', { count: doneCount, total: ONBOARDING_MILESTONES.length })}
                    <span className="onboarding-checklist-pill__progress"><i style={{ width: progress }} /></span>
                </Button>
            </div>
        )
    }

    return (
        <aside className="onboarding-checklist" aria-label={t('checklist.title')} style={{ zIndex: ONBOARDING_Z_INDEX.checklist }}>
            <div className="onboarding-checklist__header">
                <Button type="text" onClick={() => setExpanded(false)} testId="onboarding-checklist-collapse">
                    <span><strong>{t('checklist.title')}</strong><small>{t('checklist.done', { count: doneCount, total: ONBOARDING_MILESTONES.length })}</small></span>
                    <Icon name="chevron-down" size={15} color="inherit" />
                </Button>
            </div>
            <div className="onboarding-checklist__progress"><i style={{ width: progress }} /></div>
            <div className="onboarding-checklist__items">
                {ONBOARDING_MILESTONES.map(item => {
                    const done = isMilestoneDone(item.id)
                    const current = item.id === currentMilestone
                    return (
                        <div key={item.id} className={`onboarding-checklist__item${current ? ' is-current' : ''}${done ? ' is-done' : ''}`}>
                            <span className="onboarding-checklist__state"><MilestoneIcon done={done} current={current} /></span>
                            <span>
                                <strong>{t(`checklist.${item.key}.title`)}</strong>
                                <small>{t(`checklist.${item.key}.detail`)}</small>
                            </span>
                        </div>
                    )
                })}
            </div>
            <footer>
                <Button type="text" className="onboarding-checklist__dismiss" onClick={() => void handleDismiss()} testId="onboarding-checklist-dismiss">
                    {t('actions.dismiss')}
                </Button>
                <span className="onboarding-checklist__footer-actions">
                    {canContinue && (
                        <Button type="primary" onClick={handleContinue} testId="onboarding-checklist-continue">
                            {t('actions.resume')}
                        </Button>
                    )}
                    <Button type="link" className="onboarding-checklist__restart" onClick={handleRestart} testId="onboarding-checklist-restart">
                        {t('actions.restart')}
                    </Button>
                </span>
            </footer>
        </aside>
    )
}

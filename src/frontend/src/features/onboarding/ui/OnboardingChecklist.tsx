import { useState } from 'react'
import type { OnboardingStatus, OnboardingStepId } from '../model/types'
import './onboardingChecklist.css'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Check, ChevronDown, Circle, LockKeyhole } from 'lucide-react'

type ChecklistProps = {
    stepId: OnboardingStepId
    status: OnboardingStatus
    onResume: () => void
    onRestart: () => void
    onDismiss: () => void
    hasInvokers: boolean
}

const MILESTONES = [
    { id: 'theme', key: 'theme' },
    { id: 'palette', key: 'palette' },
    { id: 'invoker', key: 'invoker' },
    { id: 'connector-general', key: 'connector' },
    { id: 'connector-created', key: 'integration' },
] as const

const STEP_ORDER: OnboardingStepId[] = ['welcome', 'theme', 'palette', 'invoker-explainer', 'invoker', 'connector-general', 'connector-credentials', 'connector-created']

export function OnboardingChecklist({ stepId, status, onResume, onRestart, onDismiss, hasInvokers }: ChecklistProps) {
    const { t } = useI18n('onboarding')
    const [expanded, setExpanded] = useState(false)
    const [confirmDismiss, setConfirmDismiss] = useState(false)
    const currentStep = STEP_ORDER.indexOf(stepId)
    const isMilestoneDone = (id: typeof MILESTONES[number]['id']) => {
        if (status === 'completed') return true
        if (id === 'invoker') return hasInvokers
        return STEP_ORDER.indexOf(id) < currentStep
    }
    const doneCount = MILESTONES.filter(item => isMilestoneDone(item.id)).length
    const currentMilestone = MILESTONES.find(item => !isMilestoneDone(item.id))?.id
    const handleResume = () => {
        setExpanded(false)
        onResume()
    }

    if (!expanded) {
        return (
            <button className={`onboarding-checklist-pill${status === 'paused' ? ' is-paused' : ''}`} onClick={() => setExpanded(true)}>
                {status === 'paused' ? t('checklist.paused') : t('checklist.pill', { count: doneCount })}
                <span><i style={{ width: `${doneCount * 20}%` }} /></span>
            </button>
        )
    }

    return (
        <aside className="onboarding-checklist" aria-label="Setup progress">
            <button className="onboarding-checklist__header" onClick={() => setExpanded(false)}>
                <span><strong>{t('checklist.title')}</strong><small>{t('checklist.done', { count: doneCount })}</small></span><ChevronDown size={15} aria-hidden />
            </button>
            <div className="onboarding-checklist__progress"><i style={{ width: `${doneCount * 20}%` }} /></div>
            <div className="onboarding-checklist__items">
                {MILESTONES.map(item => {
                    const done = isMilestoneDone(item.id)
                    const current = !done && item.id === currentMilestone
                    return (
                        <div key={item.id} className={`onboarding-checklist__item${current ? ' is-current' : ''}${done ? ' is-done' : ''}`}>
                            <span className="onboarding-checklist__state">{done ? <Check size={13} strokeWidth={3} /> : current ? <Circle size={18} /> : <LockKeyhole size={14} />}</span>
                            <span><strong>{t(`checklist.${item.key}.title`)}</strong><small>{t(`checklist.${item.key}.detail`)}</small>{current && status === 'paused' && <button onClick={handleResume}>{t('actions.resume')}</button>}</span>
                        </div>
                    )
                })}
            </div>
            {confirmDismiss ? (
                <div className="onboarding-checklist__confirm">
                    <strong>{t('checklist.dismissTitle')}</strong>
                    <small>{t('checklist.dismissBody')}</small>
                    <span><button onClick={() => setConfirmDismiss(false)}>{t('actions.keep')}</button><button className="is-danger" onClick={onDismiss}>{t('actions.hide')}</button></span>
                </div>
            ) : (
                <footer><button onClick={() => setConfirmDismiss(true)}>{t('actions.dismiss')}</button><button onClick={onRestart}>{t('actions.restart')}</button></footer>
            )}
        </aside>
    )
}

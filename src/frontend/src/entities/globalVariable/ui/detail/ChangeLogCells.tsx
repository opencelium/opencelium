import React from 'react'
import { Link } from 'react-router-dom'
import { Typography } from '@shared/ui/primitives/Typography'
import type { GlobalVariableChange, JsonValue } from '../../model/types'

export type Translate = (key: string, values?: Record<string, unknown>) => string

const compact = (value: JsonValue) => (value === null ? '—' : JSON.stringify(value)).slice(0, 120)

export const ActorCell: React.FC<{ change: GlobalVariableChange; t: Translate }> = ({ change, t }) => {
    const { actor } = change
    if (actor.type === 'USER') return <span>{t('global-variable.changes.actor.user', { name: actor.userName })}</span>
    return (
        <span>
            <Link to={`/workflow/update/${actor.workflowId}`}>{actor.workflowTitle}</Link>{' '}
            <Typography variant="caption" isSubtle>{t('global-variable.changes.actor.execution', { id: actor.executionId })}</Typography>
        </span>
    )
}

export const WhatCell: React.FC<{ change: GlobalVariableChange; t: Translate }> = ({ change, t }) => {
    if (change.changedFields?.length) {
        return <span>{t('global-variable.changes.changedFields', { fields: change.changedFields.map((field) => field.field).join(', ') })}</span>
    }
    const origin = change.source?.origins[0]
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <code style={{ overflowWrap: 'anywhere' }}>{`${compact(change.oldValue)} → ${compact(change.newValue)}`}</code>
            {change.writeCount && change.writeCount > 1 && (
                <Typography variant="caption" isSubtle>{t('global-variable.changes.writeCount', { count: change.writeCount })}</Typography>
            )}
            {change.source && (
                <Typography variant="caption" isSubtle>
                    {[change.source.step.label, origin?.method.name, origin?.path, origin?.connector?.title].filter(Boolean).join(' · ')}
                </Typography>
            )}
        </div>
    )
}

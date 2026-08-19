import React, {useState} from 'react'
import {message} from 'antd'
import {Button} from '@shared/ui/primitives/Button'
import {Switch} from '@shared/ui/primitives/Switch'
import {Typography} from '@shared/ui/primitives/Typography'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {
    useGetApplicationConfigQuery,
    useUpdateApplicationConfigMutation,
} from '@entities/systemConfig/api/systemConfigApi'
import type {ConfigNode, ConfigScalar, ConfigStatus} from '@entities/systemConfig/model/types'
import {buildNodeByPathMap} from '@entities/systemConfig/model/helpers'
import {ConfigLeafEditor} from '@entities/systemConfig/ui/ConfigLeafEditor'
import { notifyError } from '@shared/ui/feedback/notifyError'

type LeafValue = ConfigScalar | ConfigScalar[]

type Props = {
    path: string
    onSaved: () => void
}

/**
 * Single-leaf editor mounted inside the global modal from the command palette.
 * Reuses the page's value editor and the shared PATCH mutation, sending only
 * the one changed node (`{ fields: [{ path, status, value }] }`).
 */
export const ConfigLeafEditDialog: React.FC<Props> = ({path, onSaved}) => {
    const {data} = useGetApplicationConfigQuery()
    const node = data?.fields ? buildNodeByPathMap(data.fields).get(path) : undefined

    if (!node) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
                <Loading />
            </div>
        )
    }

    return <LeafEditForm node={node} onSaved={onSaved} />
}

const LeafEditForm: React.FC<{node: ConfigNode; onSaved: () => void}> = ({node, onSaved}) => {
    const {t} = useI18n('entities')
    const [updateConfig, {isLoading: isSaving}] = useUpdateApplicationConfigMutation()
    const [value, setValue] = useState<LeafValue>(node.value as LeafValue)
    const [status, setStatus] = useState<ConfigStatus>(node.status)

    const handleSave = async () => {
        const res = await updateConfig({fields: [{path: node.path, status, value}]})
        if ('error' in res && res.error) {
            const err = res.error as {data?: {message?: string}}
            notifyError(err.data?.message ?? t('system-config.messages.saveFailed'))
            return
        }
        message.success(t('system-config.messages.saved'))
        onSaved()
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <Typography variant="title">{t('system-config.commandPalette.editTitle')}</Typography>
            <Typography variant="caption" isSubtle as="div">
                {node.path}
            </Typography>

            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <Typography variant="label">{t('system-config.commandPalette.valueLabel')}</Typography>
                <ConfigLeafEditor path={node.path} value={value} onChange={setValue} />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <Typography variant="label">{t('system-config.commandPalette.statusLabel')}</Typography>
                <Switch
                    checked={status === 'active'}
                    onChange={(checked) => setStatus(checked ? 'active' : 'inactive')}
                />
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <Button type="primary" htmlType="button" loading={isSaving} onClick={handleSave}>
                    {t('system-config.actions.save')}
                </Button>
            </div>
        </div>
    )
}

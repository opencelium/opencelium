import React, {useMemo} from 'react'
import {message} from 'antd'
import {EntityWizard} from '@/engine/entity/runtime/EntityWizard'
import {useWizardSubmit} from '@/engine/entity/runtime/genererics/useWizardSubmit'
import type {Connector, ConnectorUpdateDto} from '@entities/connector/model/types'
import {buildDuplicateConnectorValues} from '@entities/connector/lib/buildDuplicateConnectorValues'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {useDialogController} from '@shared/ui/dialog/DialogContext'
import {IconButton} from '@shared/ui/primitives/IconButton'
import {Tooltip} from '@shared/ui/primitives/Tooltip'

type Props = {
    row: Connector
}

const DuplicateConnectorWizard: React.FC<Props & {onClose: () => void}> = ({row, onClose}) => {
    const {t} = useI18n('entities')
    const submit = useWizardSubmit({entityName: 'connector', mode: 'create'})
    const initialValues = useMemo(() => buildDuplicateConnectorValues(row), [row])

    const handleSubmit = async (data: unknown) => {
        const formData = data as ConnectorUpdateDto
        await submit(formData)
        message.success(t('connector.list.duplicate.success', {title: formData.title}))
        onClose()
    }

    return (
        <EntityWizard
            entityName="connector"
            mode="create"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            skipSuccessState
            hideRecommendations
            hideHeader
            compact
        />
    )
}

export const DuplicateConnectorAction: React.FC<Props> = ({row}) => {
    const {t} = useI18n('entities')
    const dialog = useDialogController()

    const open = () => dialog.open({
        title: t('connector.list.duplicate.dialogTitle'),
        width: 760,
        testId: 'connector-duplicate-dialog',
        content: <DuplicateConnectorWizard row={row} onClose={dialog.close}/>,
    })

    return (
        <Tooltip content={t('connector.list.duplicate.tooltip')} placement="top">
            <IconButton
                iconProps={{name: 'content-copy', color: 'primary', size: 15}}
                type="text"
                size="xs"
                onClick={open}
                testId="connector-duplicate-trigger"
            />
        </Tooltip>
    )
}

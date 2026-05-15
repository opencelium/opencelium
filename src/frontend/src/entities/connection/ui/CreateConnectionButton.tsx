import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'

export const CreateConnectionButton: React.FC = () => {
    const navigate = useNavigate()
    const { t: tCommon } = useI18n('common')

    return (
        <Button type="primary" onClick={() => navigate('/connection/create')}>
            {tCommon('actions.create')}
        </Button>
    )
}

import { RefreshCw } from 'lucide-react'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import './RefreshButton.css'

type RefreshButtonProps = {
    onClick: () => void
    loading?: boolean
    testId?: string
}

export function RefreshButton({ onClick, loading, testId }: RefreshButtonProps) {
    const { t } = useI18n('dashboard')
    return (
        <Tooltip content={t('refresh')} placement="top">
            <button
                className="dashboardRefreshButton"
                type="button"
                onClick={onClick}
                aria-label={t('refresh')}
                data-testid={testId}
            >
                <RefreshCw size={15} className={loading ? 'dashboardRefreshSpin' : undefined} />
            </button>
        </Tooltip>
    )
}

import { useIsAdmin } from '@features/auth/useIsAdmin'
import { isAiConfigured, useGetAiHealthQuery } from '../api/aiApi'
import { AiModelsSection } from './AiModelsSection'
import { AiStatusSection } from './AiStatusSection'
import { BeebotSettingsSection } from './BeebotSettingsSection'
import { AiSettingsAdmin } from './admin/AiSettingsAdmin'
import './aiSettings.css'

/**
 * The AI in one place: whether it is there, which model does what, and Beebot; admins change the gateway's settings
 * here. Shown as the AI settings page, and as a dialog from the workflow editor so the open workflow stays put.
 */
export function AiSettingsContent() {
    const isConfigured = isAiConfigured()
    const health = useGetAiHealthQuery(undefined, { skip: !isConfigured, refetchOnMountOrArgChange: true })
    const isAdmin = useIsAdmin()
    const isGatewayUp = isConfigured && !health.isError && Boolean(health.data)
    return (
        <div className="aiSettingsContent">
            <AiStatusSection isConfigured={isConfigured} health={health.data} isUnreachable={health.isError}
                isChecking={health.isFetching} onCheckAgain={() => void health.refetch()} />
            {health.data && !isAdmin && <AiModelsSection health={health.data} />}
            {isAdmin && isGatewayUp && <AiSettingsAdmin onSaved={() => void health.refetch()}
                readOnly={health.data && <AiModelsSection health={health.data} />} />}
            {isConfigured && <BeebotSettingsSection />}
        </div>
    )
}

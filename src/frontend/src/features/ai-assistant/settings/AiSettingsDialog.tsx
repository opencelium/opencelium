import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Dialog } from '@shared/ui/primitives/Dialog'
import { AiSettingsContent } from './AiSettingsContent'

type Props = { open: boolean; onClose: () => void }

/** The AI settings over the workflow editor; changes not saved yet are dropped on close, as when leaving the page. */
export function AiSettingsDialog({ open, onClose }: Props) {
    const { t } = useI18n('entities')
    return (
        <Dialog open={open} onClose={onClose} title={t('ai-settings.page.title')} width={960} top={18} maximizable
            testId="ai-settings-dialog">
            {open && <AiSettingsContent />}
        </Dialog>
    )
}

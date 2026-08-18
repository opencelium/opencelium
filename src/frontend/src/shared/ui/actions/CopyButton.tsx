import { message } from 'antd';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { copyToClipboard } from '@shared/utils/copyToClipboard';

type Props = {
    value: string;
    // Applied to the wrapper so callers can opt into hover-reveal styling.
    className?: string;
};

// Copies `value` to the clipboard and shows a translated success/fail toast.
// When `value` is empty the button is disabled and the tooltip explains why.
// The wrapper stops click propagation so copying never triggers a parent's
// own click handler (e.g. a clickable row or an open/close toggle).
export function CopyButton({ value, className }: Props) {
    const { t } = useI18n('common');
    const isEmpty = !value || !value.trim();

    const handleCopy = async () => {
        if (isEmpty) return;
        if (await copyToClipboard(value)) {
            message.success(t('copy.success'));
        } else {
            message.error(t('copy.failed'));
        }
    };

    return (
        <Tooltip content={t(isEmpty ? 'copy.empty' : 'copy.tooltip')}>
            <span
                className={className}
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'inline-flex', flexShrink: 0 }}
            >
                <IconButton
                    iconProps={{ name: 'content-copy', size: 14 }}
                    type="text"
                    size="xs"
                    disabled={isEmpty}
                    onClick={handleCopy}
                />
            </span>
        </Tooltip>
    );
}

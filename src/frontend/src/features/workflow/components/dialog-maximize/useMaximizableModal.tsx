import { useState, type CSSProperties } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
// The fullscreen and header-action rules the Dialog primitive uses for its own toggle.
import '@shared/ui/primitives/Dialog/dialog.ant.css';
import '../dialogHeader.css';

type ModalLayout = { width: number | string; style?: CSSProperties; className: string };

/**
 * The Dialog primitive's maximize toggle for the editor's raw antd `Modal`s (`wfDialog`).
 * Spread `modalProps` on the Modal and render `toggle` as its first child; every opening
 * starts at the normal size.
 */
export function useMaximizableModal({ open, layout, testId, isEnabled = true }: {
	open: boolean; layout: ModalLayout; testId: string; isEnabled?: boolean;
}) {
	const { t } = useI18n('common');
	const [isMaximizedState, setIsMaximized] = useState(false);
	const [wasOpen, setWasOpen] = useState(open);
	if (open !== wasOpen) {
		setWasOpen(open);
		if (!open) setIsMaximized(false);
	}
	const isMaximized = isEnabled && isMaximizedState;

	const modalProps: ModalLayout = isMaximized
		? { width: '100%', style: undefined, className: `${layout.className} ant-dialog-fullscreen` }
		: layout;
	const toggle = isEnabled ? (
		<span className='ant-dialog-header-actions'>
			<Tooltip content={t(isMaximized ? 'dialog.restore' : 'dialog.maximize')}>
				<IconButton iconProps={{ name: isMaximized ? 'minimize' : 'maximize' }} size='xs' type='text'
					onClick={() => setIsMaximized((current) => !current)} testId={testId} />
			</Tooltip>
		</span>
	) : null;
	return { isMaximized, modalProps, toggle };
}

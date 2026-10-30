import type { ReactNode } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';

type Props = {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Shown in the 32px slot left of the title, e.g. a connector icon. */
	icon?: ReactNode;
	onClose: () => void;
	closeTestId: string;
	/** Extra content under the subtitle. */
	children?: ReactNode;
};

/** The one header every right-hand workflow sidebar uses: title, optional subtitle, and the close button. */
export function DrawerHeader({ title, subtitle, icon, onClose, closeTestId, children }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className="drawerHeader">
			<div className="drawerHeaderContent">
				{icon !== undefined && <div className="drawerHeaderIcon" aria-hidden="true">{icon}</div>}
				<div>
					<div className="drawerTitle">{title}</div>
					{subtitle !== undefined && <div className="drawerSubTitle">{subtitle}</div>}
					{children}
				</div>
			</div>
			<Tooltip content={t('actions.close')}>
				<IconButton iconProps={{ name: 'close', color: 'primary', size: 16 }} onClick={onClose} testId={closeTestId} />
			</Tooltip>
		</div>
	);
}

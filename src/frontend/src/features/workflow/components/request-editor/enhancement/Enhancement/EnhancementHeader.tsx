import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ReactNode } from 'react';

type Props = {
	canDelete: boolean;
	readOnly?: boolean;
	onDelete?: () => void;
	children?: ReactNode;
	isPlaygroundOpen?: boolean;
	onTogglePlayground?: () => void;
	onToggleMaximized?: () => void;
	isMaximized?: boolean;
};

export function EnhancementHeader({
	canDelete,
	readOnly,
	onDelete,
	children,
	isPlaygroundOpen,
	onTogglePlayground,
	onToggleMaximized,
	isMaximized,
}: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const maximizeLabel = t(
		isMaximized ? 'actions.minimizeEnhancement' : 'actions.maximizeEnhancement',
	);
	return (
		<div className="bodyLegacyEnhancementHeader">
			<span>{t('sandbox.enhancement')}</span>
			{/* The header is a Collapse label: keep its clicks from toggling the panel. */}
			<span className="bodyLegacyEnhancementActions" onClick={(event) => event.stopPropagation()}>
				{onTogglePlayground && (
					<Tooltip content={t('sandbox.title')}>
						<IconButton
							type="text"
							size="xs"
							testId="script-playground-toggle"
							className={isPlaygroundOpen ? 'scriptHeaderAction--active' : undefined}
							iconProps={{ name: 'flask', color: isPlaygroundOpen ? 'primary' : 'inherit' }}
							onClick={onTogglePlayground}
						/>
					</Tooltip>
				)}
				{children}
				{onToggleMaximized && (
					<Tooltip content={maximizeLabel}>
						<IconButton
							type="text"
							size="xs"
							testId="workflow-script-maximize"
							iconProps={{ name: isMaximized ? 'minimize' : 'maximize', color: 'inherit' }}
							onClick={onToggleMaximized}
						/>
					</Tooltip>
				)}
				{onDelete && (
					<span
						className="bodyLegacyEnhancementDelete"
						onClick={async () => {
							const confirmed = await confirm({
								title: t('enhancement.confirmDelete.title'),
								message: t('enhancement.confirmDelete.message'),
							});
							if (confirmed) onDelete();
						}}
					>
						<Tooltip
							content={t(
								canDelete
									? 'actions.deleteEnhancement'
									: 'enhancement.deleteDisabledMultipleReferences',
							)}
						>
							<DeleteIconButton
								iconSize={15}
								disabled={readOnly || !canDelete}
								testId="workflow-enhancement-delete"
							/>
						</Tooltip>
					</span>
				)}
			</span>
		</div>
	);
}

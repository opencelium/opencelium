import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { FlaskConical, Maximize2, Minimize2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
	canDelete: boolean;
	readOnly?: boolean;
	onDelete?: () => void;
	children?: ReactNode;
	playgroundOpen?: boolean;
	onTogglePlayground?: () => void;
	onToggleMaximized?: () => void;
	maximized?: boolean;
};

export function EnhancementHeader({
	canDelete,
	readOnly,
	onDelete,
	children,
	playgroundOpen,
	onTogglePlayground,
	onToggleMaximized,
	maximized,
}: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	return (
		<div className="bodyLegacyEnhancementHeader">
			<span>{t('sandbox.enhancement')}</span>
			<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				{onTogglePlayground && (
					<Tooltip content={t('sandbox.title')}>
						<button
							type="button"
							data-testid="script-playground-toggle"
							aria-label={t('sandbox.title')}
							aria-pressed={playgroundOpen}
							className={
								playgroundOpen
									? 'scriptDebugTrigger scriptDebugTrigger--active'
									: 'scriptDebugTrigger'
							}
							onClick={(event) => {
								event.stopPropagation();
								onTogglePlayground();
							}}
						>
							<FlaskConical size={14} />
						</button>
					</Tooltip>
				)}
				{children}
				{onToggleMaximized && (
					<Tooltip content={t(maximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}>
						<button
							type="button"
							className="scriptDebugTrigger"
							data-testid="workflow-script-maximize"
							aria-label={t(maximized ? 'actions.minimizeScript' : 'actions.maximizeScript')}
							onClick={(event) => {
								event.stopPropagation();
								onToggleMaximized();
							}}
						>
							{maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
						</button>
					</Tooltip>
				)}
				{onDelete && (
					<span
						onClick={async (event) => {
							event.stopPropagation();
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

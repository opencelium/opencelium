import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { postConnectorIcon, removeConnectorIcon } from '@entities/connector/model/connectorIconUpload';
import { isApiExecutorError } from '@shared/api/isApiExecutorError';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { notifyError } from '@shared/ui/feedback/notifyError';

type PendingChange =
	| { kind: 'none' }
	| { kind: 'upload'; file: File }
	| { kind: 'remove' };

/**
 * Stages a picked or removed image until Save, then writes straight to the
 * connector, outside the workflow's save and undo. The request invalidates the
 * shared 'Entity' tag, so the connector list refetches and every node hydrated
 * from it picks the new image up on its own.
 */
export function useConnectorImageActions(connectorId: number, storedSrc: string | null, onDone: () => void) {
	const { t } = useI18n('workflow');
	const { t: tEntities } = useI18n('entities');
	const confirm = useConfirm();
	const [pending, setPending] = useState<PendingChange>({ kind: 'none' });
	const [isSaving, setIsSaving] = useState(false);

	const previewUrl = useMemo(
		() => (pending.kind === 'upload' ? URL.createObjectURL(pending.file) : null),
		[pending],
	);
	useEffect(() => {
		if (!previewUrl) return;
		return () => URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	const src = pending.kind === 'upload' ? previewUrl : pending.kind === 'remove' ? null : storedSrc;

	const stageRemove = async () => {
		const ok = await confirm({
			title: tEntities('connector.fields.icon.confirmDelete.title'),
			message: t('connectorImageDialog.confirmRemoveMessage'),
		});
		if (ok) setPending(storedSrc ? { kind: 'remove' } : { kind: 'none' });
	};

	const save = async () => {
		if (pending.kind === 'none') return;
		setIsSaving(true);
		const result = pending.kind === 'upload'
			? await postConnectorIcon(connectorId, pending.file, { ignoreError: true })
			: await removeConnectorIcon(connectorId, { ignoreError: true });
		setIsSaving(false);
		const isUpload = pending.kind === 'upload';
		if (isApiExecutorError(result)) {
			notifyError(t(isUpload ? 'connectorImageDialog.updateFailed' : 'connectorImageDialog.removeFailed'));
			return;
		}
		message.success(t(isUpload ? 'connectorImageDialog.updated' : 'connectorImageDialog.removed'));
		onDone();
	};

	return {
		src,
		isSaving,
		hasChanges: pending.kind !== 'none',
		stageUpload: (file: File) => setPending({ kind: 'upload', file }),
		stageRemove,
		save,
	};
}

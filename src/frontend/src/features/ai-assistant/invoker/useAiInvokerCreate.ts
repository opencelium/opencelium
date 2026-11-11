import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { uploadInvoker } from '@entities/invoker/lib/uploadInvoker';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useBuildInvokerXmlMutation, useDraftInvokerMutation } from '../api/aiApi';
import type { InvokerDraft, InvokerDraftResponse } from '../model/aiGateway.types';
import { defaultSelection, reviewedDraft, toInvokerName } from './invokerDraft.utils';

export type AiInvokerStep =
	| { step: 'docs' }
	| { step: 'drafting' }
	| { step: 'review'; result: InvokerDraftResponse }
	| { step: 'creating'; result: InvokerDraftResponse };

/** What went wrong, for a translated message in the dialog. */
export type AiInvokerFailure = 'draft' | 'create' | null;

/** What the review can change; specs often leave out how to authenticate, so that is editable too. */
export type AiInvokerEdits = Pick<InvokerDraft, 'name' | 'baseUrl' | 'testOperation' | 'auth'>;

/**
 * Docs → draft → review → invoker. Creating goes through the same upload as the list's Upload button, so the
 * replace confirmation, size checks and list refresh behave exactly as for a hand-written XML file.
 */
export function useAiInvokerCreate(onCreated: () => void) {
	const { t } = useI18n('entities');
	const confirm = useConfirm();
	const [draftInvoker] = useDraftInvokerMutation();
	const [buildXml] = useBuildInvokerXmlMutation();
	const [state, setState] = useState<AiInvokerStep>({ step: 'docs' });
	const [failure, setFailure] = useState<AiInvokerFailure>(null);
	const [docs, setDocs] = useState('');
	const [nameHint, setNameHint] = useState('');
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [edits, setEdits] = useState<AiInvokerEdits>({ name: '', baseUrl: '', testOperation: '', auth: { kind: 'none', keyName: '' } });
	const pendingDraft = useRef<{ abort: () => void } | null>(null);
	// Closing the dialog while a draft is being written drops it, and the gateway stops the model with it.
	useEffect(() => () => pendingDraft.current?.abort(), []);

	const draft = async () => {
		if (!docs.trim()) return;
		setFailure(null);
		setState({ step: 'drafting' });
		try {
			const request = draftInvoker({ docs, name: nameHint.trim() });
			pendingDraft.current = request;
			const result = await request.unwrap().finally(() => {
				if (pendingDraft.current === request) pendingDraft.current = null;
			});
			setSelected(defaultSelection(result.draft));
			setEdits({ name: toInvokerName(result.draft.name), baseUrl: result.draft.baseUrl, testOperation: result.draft.testOperation,
				auth: result.draft.auth });
			setState({ step: 'review', result });
		} catch {
			setFailure('draft');
			setState({ step: 'docs' });
		}
	};

	const create = async () => {
		if (state.step !== 'review' || selected.size === 0) return;
		const { result } = state;
		const reviewed = reviewedDraft(result.draft, selected, edits);
		setFailure(null);
		setState({ step: 'creating', result });
		try {
			const { xml } = await buildXml({ draft: reviewed }).unwrap();
			const file = new File([xml], `${reviewed.name}.xml`, { type: 'application/xml' });
			const upload = await uploadInvoker(file, () => confirm({
				title: t('invoker.list.upload.confirmReplace.title'),
				message: t('invoker.list.upload.confirmReplace.message'),
			}));
			if (upload.status === 'uploaded') {
				message.success(t('invoker.list.aiCreate.success', { name: reviewed.name, count: reviewed.operations.length }));
				onCreated();
				return;
			}
			if (upload.status !== 'cancelled') setFailure('create');
		} catch {
			setFailure('create');
		}
		setState({ step: 'review', result });
	};

	const toggle = (names: string[], isOn: boolean) => setSelected((current) => {
		const next = new Set(current);
		for (const name of names) {
			if (isOn) next.add(name);
			else next.delete(name);
		}
		return next;
	});

	const backToDocs = () => {
		setFailure(null);
		setState({ step: 'docs' });
	};

	/** Drops a draft still being written: the dialog was closed without waiting for it. */
	const abandon = () => pendingDraft.current?.abort();

	return {
		abandon, state, failure, docs, setDocs, nameHint, setNameHint, selected, toggle, edits, setEdits, draft, create, backToDocs };
}

export type AiInvokerCreate = ReturnType<typeof useAiInvokerCreate>;

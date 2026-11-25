import { useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { collectGlobalNames } from '@entities/globalVariable/lib/globalReference';
import { useWorkflowRunPolicy } from '@entities/globalVariable/ui/run-policy/useWorkflowRunPolicy';
import type { BusyPolicy } from '@entities/globalVariable/model/types';

export type RunPolicyNotice = { busyPolicy: BusyPolicy; summary: string; hint: string };

type Args = {
	connectionId: number | null;
	nodes: { data: unknown }[];
	fieldBindings: unknown;
};

// Null for a workflow without mutable global variables; otherwise the backend runs it one
// execution at a time, and the variables' busy policy decides what a second start does.
export function useWorkflowRunPolicyNotice({ connectionId, nodes, fieldBindings }: Args): RunPolicyNotice | null {
	const { t } = useI18n('workflow');
	const namesKey = useMemo(() => collectGlobalNames([nodes.map((node) => node.data), fieldBindings]).join(','),
		[nodes, fieldBindings]);
	const referencedNames = useMemo(() => (namesKey ? namesKey.split(',') : []), [namesKey]);
	const policy = useWorkflowRunPolicy(connectionId, referencedNames);
	if (!policy) return null;
	const names = policy.causes.map((variable) => variable.name).join(', ');
	return {
		busyPolicy: policy.busyPolicy,
		summary: t(policy.busyPolicy === 'REFUSE' ? 'runPolicy.refuse' : 'runPolicy.queue', { names }),
		hint: t('runPolicy.hint'),
	};
}

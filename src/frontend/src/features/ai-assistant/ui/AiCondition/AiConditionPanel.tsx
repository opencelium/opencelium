import { useEffect } from 'react';
import type { ConditionGroup } from '@features/workflow/components/condition-builder/conditionBuilder.types';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Input } from '@shared/ui/primitives/Input';
import { useAiCondition } from '../../condition/useAiCondition';
import { usePendingConditionStore } from '../../condition/pendingCondition.store';
import { useAiAvailability } from '../../mapping/useAiAvailability';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';
import '../../styles/ai-condition.css';

type Props = {
	/** The if being edited, to pick up a condition asked for by voice or the palette. */
	nodeId: string;
	connection: Connection;
	methods: MethodWithId[];
	operatorIndex: string;
	onApply: (tree: ConditionGroup) => void;
};

/** A sentence above an if step's rules that writes them; hidden without the AI gateway. */
export function AiConditionPanel(props: Props) {
	const { t } = useI18n('workflow');
	const isAvailable = useAiAvailability();
	const condition = useAiCondition(props);
	const { state } = condition;
	const { buildFrom } = condition;
	const { nodeId } = props;
	useEffect(() => {
		if (!isAvailable) return;
		const instruction = usePendingConditionStore.getState().take(nodeId);
		if (instruction) buildFrom(instruction);
		// Once per dialog, when the AI is known to be there; buildFrom changes every render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAvailable, nodeId]);
	if (!isAvailable) return null;
	return (
		<div className="aiCondition" data-testid="ai-condition">
			<div className="aiConditionBar">
				<Input value={condition.instruction} placeholder={t('ai.condition.placeholder')}
					onChange={(event) => condition.setInstruction(event.target.value)}
					onKeyDown={(event) => { if (event.key === 'Enter') void condition.build(); }}
					testId="ai-condition-instruction" />
				<Button iconLeft="sparkles" onClick={() => void condition.build()} loading={state.status === 'building'}
					disabled={!condition.instruction.trim()} testId="ai-condition-build">{t('ai.condition.build')}</Button>
			</div>
			{state.status === 'building' && <div className="aiConditionNote"><AiExpectedTime feature="condition" /></div>}
			{state.status === 'built' && (
				<div className="aiConditionNote" data-testid="ai-condition-explanation">
					{state.explanation} {t('ai.condition.checkHint')}
				</div>
			)}
			{state.status === 'nothingToCompare' && <div className="aiConditionNote">{t('ai.condition.nothingToCompare')}</div>}
			{state.status === 'error' && <div className="aiConditionError">{t('ai.condition.failed')}</div>}
		</div>
	);
}

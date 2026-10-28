import { useMemo, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Input } from '@shared/ui/primitives/Input';
import type { InvokerDraftOperation } from '../../model/aiGateway.types';
import { filterOperations } from '../../invoker/invokerDraft.utils';

type Props = {
	operations: InvokerDraftOperation[];
	selected: ReadonlySet<string>;
	isDisabled: boolean;
	onToggle: (names: string[], isOn: boolean) => void;
};

// Rendering every row of a very large spec costs more than it helps; the search narrows it down.
const MAX_SHOWN = 300;

/** The draft's operations to pick from: search by name, path, group or summary; select or clear what is shown. */
export function AiInvokerOperationList({ operations, selected, isDisabled, onToggle }: Props) {
	const { t } = useI18n('entities');
	const [query, setQuery] = useState('');
	const matching = useMemo(() => filterOperations(operations, query), [operations, query]);
	const shown = matching.slice(0, MAX_SHOWN);
	return (
		<div className="aiInvokerOperations">
			<div className="aiInvokerOperationsBar">
				<Input value={query} placeholder={t('invoker.list.aiCreate.search')} onChange={(event) => setQuery(event.target.value)}
					testId="ai-invoker-search" />
				<Button type="text" disabled={isDisabled} onClick={() => onToggle(matching.map((op) => op.name), true)}
					testId="ai-invoker-select-shown">{t('invoker.list.aiCreate.selectShown')}</Button>
				<Button type="text" disabled={isDisabled} onClick={() => onToggle(matching.map((op) => op.name), false)}
					testId="ai-invoker-clear-shown">{t('invoker.list.aiCreate.clearShown')}</Button>
			</div>
			<div className="aiInvokerMeta">
				{t('invoker.list.aiCreate.selectedCount', { count: selected.size, total: operations.length })}
				{matching.length > MAX_SHOWN && ` · ${t('invoker.list.aiCreate.moreMatches', { count: matching.length - MAX_SHOWN })}`}
			</div>
			<ul className="aiInvokerOperationRows">
				{shown.map((operation) => (
					<li key={operation.name}>
						<Checkbox checked={selected.has(operation.name)} disabled={isDisabled}
							onChange={(isOn) => onToggle([operation.name], isOn)} testId={`ai-invoker-op-${operation.name}`}
							label={(
								<span className="aiInvokerOperation">
									<span className="aiInvokerMethod">{operation.method}</span>
									<span className="aiInvokerPath">{operation.path}</span>
									<span className="aiInvokerOpName">{operation.name}{operation.group ? ` · ${operation.group}` : ''}</span>
								</span>
							)} />
					</li>
				))}
			</ul>
		</div>
	);
}

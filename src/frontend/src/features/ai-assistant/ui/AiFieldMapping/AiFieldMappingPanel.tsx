import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Input } from '@shared/ui/primitives/Input';
import type { AiFieldMapping } from '../../mapping/useAiFieldMapping';
import '../../styles/ai-mapping.css';

/** "Suggest mapping" in the body editor: proposed sources per field, each picked or left, then applied together. */
export function AiFieldMappingPanel({ mapping }: { mapping: AiFieldMapping }) {
	const { t } = useI18n('workflow');
	const { state } = mapping;
	const apply = () => {
		const count = mapping.apply();
		if (count) message.success(t('ai.mapping.applied', { count }));
	};
	return (
		<div className="aiMapping" data-testid="ai-mapping">
			<p className="aiMappingHint">{t('ai.mapping.hint')}</p>
			<div className="aiMappingBar">
				<Input value={mapping.instruction} placeholder={t('ai.mapping.instructionPlaceholder')}
					onChange={(event) => mapping.setInstruction(event.target.value)} testId="ai-mapping-instruction" />
				<Button iconLeft="sparkles" onClick={() => void mapping.suggest()} loading={state.status === 'suggesting'}
					testId="ai-mapping-suggest">{t('ai.mapping.suggest')}</Button>
			</div>
			{state.status === 'nothingToMap' && <div className="aiMappingNote">{t('ai.mapping.nothingToMap')}</div>}
			{state.status === 'error' && <div className="aiMappingError" data-testid="ai-mapping-error">{t('ai.mapping.failed')}</div>}
			{state.status === 'suggested' && state.proposals.length === 0 && <div className="aiMappingNote">{t('ai.mapping.none')}</div>}
			{state.status === 'suggested' && state.proposals.length > 0 && (
				<>
					<ul className="aiMappingRows">
						{state.proposals.map(({ target, source, reason }) => (
							<li key={target.path} className="aiMappingRow">
								<Checkbox checked={state.chosen.has(target.path)} onChange={(isOn) => mapping.toggle(target.path, isOn)}
									testId={`ai-mapping-choose-${target.path}`}
									label={(
										<span className="aiMappingRowText">
											<span className="aiMappingField">{target.path}</span>
											<span className="aiMappingArrow">←</span>
											<span className="aiMappingSource">{source.step} › {source.path}</span>
											{target.current && <span className="aiMappingReplaces">{t('ai.mapping.replaces', { value: target.current })}</span>}
											{reason && <span className="aiMappingReason">{reason}</span>}
										</span>
									)} />
							</li>
						))}
					</ul>
					<div className="aiMappingBar">
						<Button type="primary" onClick={apply} disabled={state.chosen.size === 0} testId="ai-mapping-apply">
							{t('ai.mapping.apply', { count: state.chosen.size })}
						</Button>
						<Button onClick={mapping.discard} testId="ai-mapping-discard">{t('ai.mapping.discard')}</Button>
					</div>
				</>
			)}
		</div>
	);
}

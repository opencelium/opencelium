import { useState } from 'react';
import { Button } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Typography } from '@shared/ui/primitives/Typography';
import { GlobalVariableSelect } from '@entities/globalVariable/ui/picker/GlobalVariableSelect';
import { useGlobalPickerScope } from '@entities/globalVariable/ui/picker/globalPicker';
import type { PickerItem } from '@entities/globalVariable/model/types';
import type { DataAggregator } from '@entities/dataAggregator/model/types';

type Props = {
	aggregator: DataAggregator;
	value: Record<string, string>;
	onSave: (publish: Record<string, string>) => void;
};

const isWritable = (item: PickerItem) => item.kind === 'MUTABLE' && item.writable;

/** Maps aggregator outputs to mutable variables this workflow writes (contract §10, `dataAggregatorPublish`). */
export function AggregatorPublishEditor({ aggregator, value, onSave }: Props) {
	const { t } = useI18n('workflow');
	const [draft, setDraft] = useState<Record<string, string>>(value);
	if (useGlobalPickerScope() === null) return null;

	return (
		<div className="aggregatorPublish" data-testid="workflow-aggregator-publish">
			<Typography variant="label">{t('aggregatorDialog.publish.title')}</Typography>
			<Typography variant="caption" isSubtle>{t('aggregatorDialog.publish.hint')}</Typography>
			<div className="aggregatorPublishRows">
				{aggregator.args.map((arg) => (
					<label key={arg.name} className="aggregatorPublishRow">
						<code>{arg.name}</code>
						<span>→</span>
						<GlobalVariableSelect
							value={draft[arg.name]}
							filter={isWritable}
							popupZIndex={2000}
							testId={`workflow-aggregator-publish-${arg.name}`}
							onChange={(name) => setDraft((current) => ({ ...current, [arg.name]: name }))}
						/>
						{draft[arg.name] && (
							<Button type="link" size="small" onClick={() => setDraft((current) => {
								const next = { ...current };
								delete next[arg.name];
								return next;
							})}>{t('aggregatorDialog.publish.clear')}</Button>
						)}
					</label>
				))}
			</div>
			<div>
				<Button onClick={() => onSave(draft)} data-testid="workflow-aggregator-publish-save">
					{t('aggregatorDialog.publish.save')}
				</Button>
			</div>
		</div>
	);
}

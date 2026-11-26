import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { createFact } from '../../../model/notificationConfig';
import type { NotificationFact } from '../../../model/notification.types';
import { NotificationValueField } from '../../transformation/NotificationValueField';

type Props = { fieldKey: string; facts: NotificationFact[]; isDisabled: boolean; onChange: (facts: NotificationFact[]) => void };

export function FactsEditor({ fieldKey, facts, isDisabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	const update = (id: string, patch: Partial<Omit<NotificationFact, 'id'>>) =>
		onChange(facts.map((fact) => fact.id === id ? { ...fact, ...patch } : fact));
	return (
		<div className='notificationFacts'>
			{facts.map((fact, index) => (
				<div key={fact.id} className='notificationFactRow'>
					<Input value={fact.label} disabled={isDisabled} placeholder={t('notification.facts.labelPlaceholder')}
						testId={`notification-fact-label-${index}`} onChange={(event) => update(fact.id, { label: event.target.value })} />
					<NotificationValueField target={{ kind: 'fact', key: fieldKey, factId: fact.id }}
						id={`notification-fact-value-${fact.id}`} value={fact.value} disabled={isDisabled}
						placeholder={t('notification.facts.valuePlaceholder')}
						ariaLabel={t('notification.facts.valueAria', { index: index + 1 })}
						testId={`notification-fact-value-${index}`} onChange={(value) => update(fact.id, { value })} />
					<Tooltip content={t('notification.facts.remove')}>
						<DeleteIconButton disabled={isDisabled} testId={`notification-fact-remove-${index}`}
							onClick={() => onChange(facts.filter((item) => item.id !== fact.id))} />
					</Tooltip>
				</div>
			))}
			<div>
				<Button type='link' iconLeft='plus' disabled={isDisabled} testId='notification-fact-add'
					onClick={() => onChange([...facts, createFact()])}>
					{t('notification.facts.add')}
				</Button>
			</div>
		</div>
	);
}

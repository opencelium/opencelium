import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';

type Props = {
	fromTitle?: string;
	toTitle?: string;
	onPick: (text: string) => void;
};

const EXAMPLE_KEYS = ['createForEach', 'filterAndCreate', 'lookupOrCreate'] as const;

export function AiExamplePrompts({ fromTitle, toTitle, onPick }: Props) {
	const { t } = useI18n('workflow');
	const names = {
		from: fromTitle ?? t('ai.examples.fallbackFrom'),
		to: toTitle ?? t('ai.examples.fallbackTo'),
	};

	return (
		<section className="aiPanelSection">
			<div className="aiPanelSectionTitle">{t('ai.examples.title')}</div>
			<ul className="aiExampleList">
				{EXAMPLE_KEYS.map((key) => {
					const text = t(`ai.examples.${key}`, names);
					return (
						<li key={key}>
							<button type="button" className="aiExample" onClick={() => onPick(text)}
								data-testid={`ai-panel-example-${key}`}>
								<Icon name="sparkles" size={14} color="inherit" />
								<span>{text}</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

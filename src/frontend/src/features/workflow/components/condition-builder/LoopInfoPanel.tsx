import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';

type LoopExample = {
	methodLabel?: string;
	connectorIcon?: string | null;
	hasMethod: boolean;
	responseType: 'body' | 'header' | 'status';
};

type LoopTour = {
	description: string;
	args: { code: string; text: string }[];
	examples: { code: string; result: string }[];
};

const KNOWN_OPERATORS = new Set(['for', 'forin', 'SplitString']);

type Props = {
	iterator?: string;
	operator?: string;
	example?: LoopExample;
};

const responseTypeLetter = (type: LoopExample['responseType']) =>
	type === 'header' ? 'H' : type === 'status' ? 'S' : 'B';

export function LoopInfoPanel({ iterator, operator, example }: Props) {
	const { t } = useI18n('workflow');
	const variable = iterator || 'i';

	const tour =
		operator && KNOWN_OPERATORS.has(operator)
			? (t(`conditionBuilder.loopInfo.operators.${operator}`, { returnObjects: true }) as LoopTour)
			: undefined;

	return (
		<aside className="loopInfoPanel">
			<div className="loopInfoColumns">
				<div className="loopInfoCol">
					{tour ? (
						<>
							<div className="loopInfoBlock">
								<span className="loopInfoLabel">{t('conditionBuilder.loopInfo.descriptionLabel')}:</span>{' '}
								{tour.description}
							</div>
							<div className="loopInfoBlock">
								<span className="loopInfoLabel">{t('conditionBuilder.loopInfo.argumentsLabel')}:</span>
								<ul className="loopInfoList">
									{tour.args.map((arg) => (
										<li key={arg.code}>
											<code className="loopInfoInlineCode">{arg.code}</code>: {arg.text}
										</li>
									))}
								</ul>
							</div>
							<div className="loopInfoBlock">
								<span className="loopInfoLabel">{t('conditionBuilder.loopInfo.examplesLabel')}:</span>
								<ul className="loopInfoList">
									{tour.examples.map((item) => (
										<li key={item.code}>
											<code className="loopInfoInlineCode">{item.code}</code> → {item.result}
										</li>
									))}
								</ul>
							</div>
						</>
					) : null}
				</div>

				<div className="loopInfoCol">
					<div className="loopInfoBlock">
						<span className="loopInfoLabel">{t('conditionBuilder.loopInfo.iteratorLabel')}:</span>{' '}
						{variable}
					</div>
					{example ? (
						<>
							<div className="loopInfoHelp">{t('conditionBuilder.loopInfo.iteratorHelp')}</div>
							<div className="loopInfoExample">
								<div className="loopInfoExampleBox loopInfoExampleMethod">
									{example.hasMethod ? (
										<ConnectorIcon icon={example.connectorIcon} size={18} style={{ flexShrink: 0 }} />
									) : null}
									<span className="loopInfoExampleText">{example.methodLabel}</span>
								</div>
								<div className="loopInfoExampleBox loopInfoExampleType">
									{responseTypeLetter(example.responseType)}
								</div>
								<div className="loopInfoExampleBox loopInfoExampleField">
									<span className="loopInfoExampleLoop">
										{t('references.iteratorLoop', { iterator: variable })}
									</span>
								</div>
							</div>
						</>
					) : null}
				</div>
			</div>
		</aside>
	);
}

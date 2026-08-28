import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ReferenceRemapPlan } from '../../utils/graph.referenceRemap';
import { buildReference } from '../../utils/graph.referenceRemap';
import type { ReferenceRemapTarget } from '../../utils/graph.referenceRemapTargets';
import { CLEAR, ReferenceRemapRow } from './ReferenceRemapRow';

type Choice = {
	replacement: string;
	/** Source reference key → path on the replacement method. */
	paths: Record<string, string>;
};

type Props = {
	targets: ReferenceRemapTarget[];
	/** Reported on each change rather than read on submit: the confirm dialog
	 *  owns the buttons, so this content has no submit of its own. */
	onChange: (plan: ReferenceRemapPlan) => void;
};

/** Only what the user actually chose. A method with no replacement contributes
 *  nothing, and a field keeping its own path needs no override — the colour
 *  substitution alone already reads it from the new method. */
const buildPlan = (targets: ReferenceRemapTarget[], choices: Record<string, Choice>):
ReferenceRemapPlan => {
	const colors = new Map<string, string>();
	const references = new Map<string, string>();
	targets.forEach((target) => {
		const choice = choices[target.color];
		if (!choice || choice.replacement === CLEAR) return;
		colors.set(target.color, choice.replacement);
		target.sources.forEach((source) => {
			const path = choice.paths[source.key];
			if (path === undefined || path === source.path) return;
			references.set(source.key, buildReference({
				color: choice.replacement,
				direction: 'response',
				messageProperty: source.messageProperty,
				path,
			}));
		});
	});
	return { colors, references };
};

export function ReferenceRemapChoices({ targets, onChange }: Props) {
	const { t } = useI18n('workflow');
	const [choices, setChoices] = useState<Record<string, Choice>>({});

	const update = (color: string, choice: Choice) => {
		const next = { ...choices, [color]: choice };
		setChoices(next);
		onChange(buildPlan(targets, next));
	};

	return (
		<div className='referenceRemap' data-testid='workflow-reference-remap'>
			<div className='referenceRemapIntro'>{t('referenceRemap.intro')}</div>
			{targets.map((target) => {
				const choice = choices[target.color] ?? { replacement: CLEAR, paths: {} };
				return (
					<ReferenceRemapRow
						key={target.color}
						target={target}
						replacement={choice.replacement}
						paths={choice.paths}
						// A different method has a different response, so the paths chosen
						// against the old one cannot be carried over to it.
						onReplacementChange={(replacement) =>
							update(target.color, { replacement, paths: {} })}
						onPathChange={(sourceKey, path) =>
							update(target.color, { ...choice, paths: { ...choice.paths, [sourceKey]: path } })}
					/>
				);
			})}
		</div>
	);
}

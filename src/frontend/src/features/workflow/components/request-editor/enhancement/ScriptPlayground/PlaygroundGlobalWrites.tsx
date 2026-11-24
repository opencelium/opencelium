import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import type { GlobalWrite } from './playgroundScriptCalls';

export function PlaygroundGlobalWrites({ writes }: { writes: GlobalWrite[] }) {
	const { t } = useI18n('workflow');
	if (writes.length === 0) return null;
	return (
		<Alert
			type="info"
			showIcon
			message={t('sandbox.globalWritesTitle')}
			description={
				<div data-testid="script-playground-global-writes">
					<span>{t('sandbox.globalWritesHint')}</span>
					<ul className="scriptPlaygroundWrites">
						{writes.map((write, index) => (
							<li key={`${write.target}-${index}`}>
								<code>{write.target}</code> = <code>{write.value}</code>
							</li>
						))}
					</ul>
				</div>
			}
		/>
	);
}

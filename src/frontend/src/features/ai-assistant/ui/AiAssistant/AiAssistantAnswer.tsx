import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { splitCitations } from '../../assistant/citations';
import { type AssistantTurn, useAssistantStore } from '../../assistant/assistantStore';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';

type Answer = Extract<AssistantTurn, { role: 'assistant' }>;

/** One answer: its text with source links, the sources it drew on, and the commands it offers. */
export function AiAssistantAnswer({ turn }: { turn: Answer }) {
	const { t } = useI18n('common');
	const runInPalette = useAssistantStore((state) => state.runInPalette);
	if (turn.status === 'error') return <div className="aiAssistantError">{t('assistant.failed')}</div>;
	return (
		<div className="aiAssistantAnswer">
			{turn.status === 'searching' && <div className="aiAssistantMeta"><Loading size="xs" inline /> {t('assistant.searching')} <AiExpectedTime feature="help" /></div>}
			{turn.text && (
				<div className="aiAssistantText">
					{splitCitations(turn.text, turn.sources).map((part, index) => (part.kind === 'text'
						? <span key={index}>{part.text}</span>
						: <a key={index} href={part.source.url} target="_blank" rel="noreferrer" className="aiAssistantCite"
							title={part.source.title}>{part.source.n}</a>))}
					{turn.status === 'writing' && <span className="aiAssistantCursor" aria-hidden />}
				</div>
			)}
			{turn.status === 'done' && turn.sources.length > 0 && (
				<ol className="aiAssistantSources">
					{turn.sources.map((source) => (
						<li key={source.n} value={source.n}>
							<a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
						</li>
					))}
				</ol>
			)}
			{turn.status === 'done' && turn.actions.length > 0 && (
				<div className="aiAssistantActions">
					{turn.actions.map((action) => (
						<Button key={action.id} iconLeft="command" onClick={() => runInPalette(action.prefix)}
							testId={`assistant-action-${action.id}`}>{action.label}</Button>
					))}
				</div>
			)}
		</div>
	);
}

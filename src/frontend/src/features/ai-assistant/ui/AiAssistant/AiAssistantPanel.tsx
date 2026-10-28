import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useAssistantStore } from '../../assistant/assistantStore';
import { useAssistantChat } from '../../assistant/useAssistantChat';
import { AiAssistantAnswer } from './AiAssistantAnswer';
import '../../styles/ai-assistant.css';

/** The help assistant: a conversation answered from the documentation, opened from the top bar or the palette. */
export function AiAssistantPanel() {
	const { t } = useI18n('common');
	const { isOpen, turns, close, newConversation, takePendingQuestion } = useAssistantStore();
	const { send, stop } = useAssistantChat();
	const [draft, setDraft] = useState('');
	const endRef = useRef<HTMLDivElement>(null);
	const last = turns.at(-1);
	const isBusy = last?.role === 'assistant' && (last.status === 'searching' || last.status === 'writing');

	useEffect(() => {
		if (!isOpen) return;
		const question = takePendingQuestion();
		if (question) void send(question);
	}, [isOpen, send, takePendingQuestion]);

	// Braces matter: scrollIntoView returns a promise in newer browsers, and an effect may only return its cleanup.
	useEffect(() => {
		endRef.current?.scrollIntoView({ block: 'end' });
	}, [turns]);

	useEffect(() => {
		if (!isOpen) return;
		const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [isOpen, close]);

	if (!isOpen) return null;
	const submit = () => {
		if (!draft.trim() || isBusy) return;
		void send(draft);
		setDraft('');
	};
	return (
		<aside className="aiAssistant" data-testid="assistant-panel" aria-label={t('assistant.title')}>
			<header className="aiAssistantHeader">
				<span className="aiAssistantTitle">{t('assistant.title')}</span>
				<Tooltip content={t('assistant.newConversation')}>
					<IconButton type="text" iconProps={{ name: 'refresh' }} disabled={turns.length === 0}
						onClick={() => { stop(); newConversation(); }} testId="assistant-new" />
				</Tooltip>
				<Tooltip content={t('assistant.close')}>
					<IconButton type="text" iconProps={{ name: 'close' }} onClick={close} testId="assistant-close" />
				</Tooltip>
			</header>
			<div className="aiAssistantBody">
				{turns.length === 0 && <p className="aiAssistantMeta">{t('assistant.intro')}</p>}
				{turns.map((turn) => (turn.role === 'user'
					? <div key={turn.id} className="aiAssistantQuestion">{turn.text}</div>
					: <AiAssistantAnswer key={turn.id} turn={turn} />))}
				<div ref={endRef} />
			</div>
			<footer className="aiAssistantFooter" onKeyDown={(event) => {
				if (event.key === 'Enter' && !event.shiftKey) {
					event.preventDefault();
					submit();
				}
			}}>
				<Textarea value={draft} placeholder={t('assistant.placeholder')} onChange={(event) => setDraft(event.target.value)}
					testId="assistant-input" />
				<Button type="primary" iconLeft="send" onClick={submit} disabled={!draft.trim() || isBusy} testId="assistant-send">
					{t('assistant.send')}
				</Button>
			</footer>
		</aside>
	);
}

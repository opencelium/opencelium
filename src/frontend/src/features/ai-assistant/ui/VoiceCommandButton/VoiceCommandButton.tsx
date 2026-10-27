import { useEffect, type CSSProperties } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { useVoiceCommand } from '../../voice/useVoiceCommand';
import './voiceCommandButton.css';

type Props = {
	voice: ReturnType<typeof useVoiceCommand>;
};

// Speech RMS rarely passes 0.2; scaled so normal speaking fills the ring.
const LEVEL_SCALE = 5;

/** The microphone in the palette: click to speak, click again to send, Escape to drop the recording. */
export function VoiceCommandButton({ voice }: Props) {
	const { t } = useI18n('common');
	const { status, cancel } = voice;

	useEffect(() => {
		if (status !== 'listening') return;
		// Capture phase: the palette input treats Escape as "close", which must not happen with the microphone open.
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			cancel();
		};
		window.addEventListener('keydown', onKeyDown, { capture: true });
		return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
	}, [status, cancel]);

	if (!voice.isAvailable) return null;
	if (status === 'processing' || status === 'transcribing') {
		return (
			<Tooltip content={t('commandPalette.voice.transcribing')}>
				<span className="voiceCommand voiceCommand--busy" data-testid="command-palette-voice-busy" role="status">
					<Loading size="xs" inline />
				</span>
			</Tooltip>
		);
	}
	const isListening = status === 'listening';
	const style = { '--voice-level': Math.min(1, voice.level * LEVEL_SCALE) } as CSSProperties;
	return (
		<Tooltip content={t(isListening ? 'commandPalette.voice.listening' : 'commandPalette.voice.start')}>
			<span className={`voiceCommand${isListening ? ' voiceCommand--listening' : ''}`} style={style}
				onMouseDown={(event) => event.preventDefault()}>
				<IconButton type="text" size="sm" testId={isListening ? 'command-palette-voice-stop' : 'command-palette-voice-start'}
					iconProps={{ name: 'microphone', color: isListening ? 'danger' : 'inherit' }}
					onClick={() => (isListening ? voice.stop() : void voice.listen())} />
			</span>
		</Tooltip>
	);
}

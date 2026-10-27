import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { useTranscribeSpeechMutation } from '../api/aiApi';
import { canRecordVoice, useVoiceRecorder } from './useVoiceRecorder';

type Options = {
	isSpeechAvailable: boolean;
	onTranscript: (text: string) => void;
};

/** One spoken command: record, transcribe locally, hand over the text. Failures say what to do about them. */
export function useVoiceCommand({ isSpeechAvailable, onTranscript }: Options) {
	const { t } = useI18n('common');
	const recorder = useVoiceRecorder();
	const [transcribe, transcription] = useTranscribeSpeechMutation();

	const listen = async () => {
		const recording = await recorder.record();
		switch (recording.kind) {
			case 'cancelled':
				return;
			case 'no-speech':
				return notifyError(t('commandPalette.voice.noSpeech'), 6);
			case 'denied':
				return notifyError(t('commandPalette.voice.denied'));
			case 'failed':
				return notifyError(t('commandPalette.voice.failed'));
			case 'audio': {
				const result = await transcribe(recording.wav).unwrap().catch(() => undefined);
				if (!result) return notifyError(t('commandPalette.voice.failed'));
				if (!result.text) return notifyError(t('commandPalette.voice.noSpeech'), 6);
				return onTranscript(result.text);
			}
			default: {
				const _exhaustive: never = recording;
				return _exhaustive;
			}
		}
	};

	const status = transcription.isLoading ? 'transcribing' : recorder.state.status;
	return {
		isAvailable: isSpeechAvailable && canRecordVoice(),
		status,
		level: recorder.state.status === 'listening' ? recorder.state.level : 0,
		listen,
		stop: recorder.stop,
		cancel: recorder.cancel,
	};
}

import { useEffect, useRef, useState } from 'react';
import { toSpeechWav } from './wavEncoding';

export type VoiceRecorderState =
	| { status: 'idle' }
	| { status: 'listening'; level: number; hasSpeech: boolean }
	| { status: 'processing' };

export type VoiceRecording =
	| { kind: 'audio'; wav: Blob }
	| { kind: 'cancelled' }
	| { kind: 'no-speech' }
	| { kind: 'denied' }
	| { kind: 'failed' };

// RMS above this counts as speech; tuned on laptop microphones with noise suppression on.
const SPEECH_LEVEL = 0.02;
const SILENCE_AFTER_SPEECH_MS = 1200;
const NO_SPEECH_TIMEOUT_MS = 6000;
const MAX_RECORDING_MS = 15_000;
const METER_INTERVAL_MS = 80;

type Session = {
	stream: MediaStream;
	recorder: MediaRecorder;
	context: AudioContext;
	timer: number;
	finish: (isCancelled: boolean) => void;
};

/** True where the browser can record: a secure context (https or localhost) with a microphone API. */
export const canRecordVoice = () =>
	typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

/**
 * Records one spoken command: stops by itself after a pause following speech, or gives up when nothing is said.
 * Resolves with 16 kHz WAV for the speech service, or with why there is none.
 */
export function useVoiceRecorder() {
	const [state, setState] = useState<VoiceRecorderState>({ status: 'idle' });
	const session = useRef<Session | null>(null);

	const release = (current: Session) => {
		window.clearInterval(current.timer);
		current.stream.getTracks().forEach((track) => track.stop());
		void current.context.close();
		session.current = null;
	};

	useEffect(() => () => session.current?.finish(true), []);

	const record = async (): Promise<VoiceRecording> => {
		if (session.current) return { kind: 'failed' };
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
		} catch (error) {
			return { kind: error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'failed' };
		}
		const context = new AudioContext();
		const analyser = context.createAnalyser();
		analyser.fftSize = 1024;
		context.createMediaStreamSource(stream).connect(analyser);
		const samples = new Float32Array(analyser.fftSize);
		const recorder = new MediaRecorder(stream);
		const chunks: Blob[] = [];
		recorder.ondataavailable = (event) => chunks.push(event.data);

		return new Promise<VoiceRecording>((resolve) => {
			const started = Date.now();
			let lastSpeech = 0;
			let isCancelled = false;
			recorder.onstop = async () => {
				const current = session.current;
				if (current) release(current);
				if (isCancelled || !lastSpeech) {
					setState({ status: 'idle' });
					return resolve({ kind: isCancelled ? 'cancelled' : 'no-speech' });
				}
				setState({ status: 'processing' });
				try {
					resolve({ kind: 'audio', wav: await toSpeechWav(new Blob(chunks, { type: recorder.mimeType })) });
				} catch {
					resolve({ kind: 'failed' });
				} finally {
					setState({ status: 'idle' });
				}
			};
			const finish = (cancel: boolean) => {
				isCancelled = cancel;
				if (recorder.state !== 'inactive') recorder.stop();
			};
			const timer = window.setInterval(() => {
				analyser.getFloatTimeDomainData(samples);
				const level = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
				const now = Date.now();
				if (level > SPEECH_LEVEL) lastSpeech = now;
				setState({ status: 'listening', level, hasSpeech: lastSpeech > 0 });
				const isDone = lastSpeech
					? now - lastSpeech > SILENCE_AFTER_SPEECH_MS
					: now - started > NO_SPEECH_TIMEOUT_MS;
				if (isDone || now - started > MAX_RECORDING_MS) finish(false);
			}, METER_INTERVAL_MS);
			session.current = { stream, recorder, context, timer, finish };
			setState({ status: 'listening', level: 0, hasSpeech: false });
			recorder.start();
		});
	};

	/** Ends the recording now and sends what was said. */
	const stop = () => session.current?.finish(false);
	/** Ends the recording and drops it. */
	const cancel = () => session.current?.finish(true);

	return { state, record, stop, cancel };
}

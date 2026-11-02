const SAMPLE_RATE = 16_000;

/** 16-bit PCM WAV, the format whisper.cpp reads without ffmpeg. */
export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Blob {
	const buffer = new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(buffer);
	const text = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
	text(0, 'RIFF');
	view.setUint32(4, 36 + samples.length * 2, true);
	text(8, 'WAVE');
	text(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	text(36, 'data');
	view.setUint32(40, samples.length * 2, true);
	samples.forEach((sample, index) => {
		const clamped = Math.max(-1, Math.min(1, sample));
		view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
	});
	return new Blob([buffer], { type: 'audio/wav' });
}

/** Resampled offline to 16 kHz mono, which is what whisper is trained on. */
async function toSpeechRate(buffer: AudioBuffer): Promise<Blob> {
	const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(buffer.duration * SAMPLE_RATE)), SAMPLE_RATE);
	const source = offline.createBufferSource();
	source.buffer = buffer;
	source.connect(offline.destination);
	source.start();
	const rendered = await offline.startRendering();
	return encodeWav(rendered.getChannelData(0));
}

/** Any recording the browser can decode (MediaRecorder gives webm/opus or mp4), resampled to 16 kHz mono WAV. */
export async function toSpeechWav(recording: Blob): Promise<Blob> {
	const context = new AudioContext();
	try {
		return await toSpeechRate(await context.decodeAudioData(await recording.arrayBuffer()));
	} finally {
		void context.close();
	}
}

/** Raw microphone samples at the device rate, resampled to 16 kHz mono WAV. */
export function samplesToSpeechWav(samples: Float32Array, sampleRate: number): Promise<Blob> {
	const buffer = new AudioBuffer({ length: Math.max(1, samples.length), numberOfChannels: 1, sampleRate });
	buffer.copyToChannel(Float32Array.from(samples), 0);
	return toSpeechRate(buffer);
}

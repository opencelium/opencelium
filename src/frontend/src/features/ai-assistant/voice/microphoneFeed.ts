export type MicrophoneFeed = { sampleRate: number; stop: () => void }

export type MicrophoneFeedResult =
    | { kind: 'started'; feed: MicrophoneFeed }
    | { kind: 'denied' }
    | { kind: 'failed' }

/** ~85 ms at 48 kHz: short enough for the level meter, long enough to keep callbacks rare. */
const FRAME_SIZE = 4096

/**
 * Opens the microphone once and hands every frame of raw mono samples to `onFrame`, for
 * as long as the feed runs. A ScriptProcessorNode rather than an AudioWorklet: a worklet
 * needs a separately served module (a blob: URL under a strict CSP), and for one 16 kHz
 * voice channel the main-thread callback costs nothing measurable.
 */
export async function openMicrophoneFeed(onFrame: (frame: Float32Array) => void): Promise<MicrophoneFeedResult> {
    let stream: MediaStream
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } })
    } catch (error) {
        return { kind: error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'failed' }
    }
    try {
        const context = new AudioContext()
        await context.resume()
        const source = context.createMediaStreamSource(stream)
        const processor = context.createScriptProcessor(FRAME_SIZE, 1, 1)
        // Chrome only runs a processor that reaches the output; muted so the room is not played back.
        const mute = context.createGain()
        mute.gain.value = 0
        processor.onaudioprocess = event => onFrame(Float32Array.from(event.inputBuffer.getChannelData(0)))
        source.connect(processor)
        processor.connect(mute)
        mute.connect(context.destination)
        const stop = () => {
            processor.onaudioprocess = null
            source.disconnect()
            processor.disconnect()
            stream.getTracks().forEach(track => track.stop())
            void context.close()
        }
        return { kind: 'started', feed: { sampleRate: context.sampleRate, stop } }
    } catch {
        stream.getTracks().forEach(track => track.stop())
        return { kind: 'failed' }
    }
}

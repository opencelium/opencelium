import { i18n } from '@shared/i18n/config/i18n'

/** The browser's own speech: local, nothing to install; how it sounds depends on the voices the OS has. */
const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)

export const canSpeak = (): boolean => synth() !== null

/** Says `text` in the UI language, after whatever is being said; `onDone` runs once it has been said. */
export function speak(text: string, onDone?: () => void): void {
    const speech = synth()
    if (!speech || !text.trim()) return
    const lang = i18n.language.startsWith('de') ? 'de-DE' : 'en-US'
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    const voices = speech.getVoices()
    const voice = voices.find(item => item.lang === lang) ?? voices.find(item => item.lang.startsWith(lang.slice(0, 2)))
    if (voice) utterance.voice = voice
    if (onDone) {
        utterance.onend = onDone
        utterance.onerror = onDone
    }
    speech.speak(utterance)
}

export const stopSpeaking = (): void => synth()?.cancel()

/** True while speaking: the microphone ignores it then, so Beebot does not hear itself. */
export const isSpeaking = (): boolean => synth()?.speaking ?? false

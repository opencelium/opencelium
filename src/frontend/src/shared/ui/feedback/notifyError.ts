import { notification } from 'antd'
import { i18n } from '@shared/i18n/config/i18n'

// Errors stay on screen until the user closes them. antd's `message` has no close
// affordance, and a toast that expires on a timer is regularly missed — while its text
// is often the only clue about what failed. Confirmations keep using `message.success`,
// which is meant to be glanced at and forgotten.
const STICKY = 0

/**
 * The single way to show an error toast: a dismiss-only antd notification with a close
 * icon. `text` must already be translated — this is called from non-React code too
 * (entity command executors, error-bus subscribers), so it can't resolve keys itself.
 *
 * Pass `durationSec` only when an error genuinely should disappear on its own; the
 * default is deliberately "until dismissed".
 *
 * `headline` replaces the generic "Error" heading with what was being attempted, so
 * `text` reads as the reason underneath it. Also already translated.
 */
export const notifyError = (text: string, durationSec?: number, headline?: string) => {
    const heading = headline || i18n.getFixedT(i18n.language, 'error')('title')
    notification.error({
        // Keyed by content so the same error reported twice updates one toast instead
        // of stacking two identical ones. One request can genuinely fail twice — a
        // refetch after the first failure, two components subscribed to the same
        // endpoint, StrictMode's double mount in dev — and none of that is worth
        // telling the user about twice. Distinct errors still stack.
        key: `${heading}\u0000${text}`,
        message: heading,
        description: text,
        duration: durationSec ?? STICKY,
    })
}

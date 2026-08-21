import { useLayoutEffect, useRef, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import './errorNotificationText.css'

type Props = {
    /** Already-translated reason line; server text is shown verbatim. */
    text: string
}

/**
 * The reason line of an error toast: clamped to a few lines, with a toggle that
 * reveals the rest when there is more. Backend replies are the reason a toast
 * ever gets long (a validation list, a stack trace, an HTML error page), and
 * those are exactly the cases where the tail carries the useful part — so the
 * text is kept whole and only the presentation is bounded.
 */
export const ErrorNotificationText = ({ text }: Props) => {
    const { t } = useI18n('error')
    const textRef = useRef<HTMLDivElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isClamped, setIsClamped] = useState(false)

    // Measured rather than guessed from the length: the toast's width, the font and
    // the message's own line breaks all decide whether four lines were enough.
    // Layout effect so the toggle is there in the first painted frame.
    useLayoutEffect(() => {
        const element = textRef.current
        if (!element) return
        setIsClamped(element.scrollHeight > element.clientHeight + 1)
    }, [text])

    return (
        <>
            <div
                ref={textRef}
                className={isExpanded ? 'ocErrorToastTextExpanded' : 'ocErrorToastText'}
                data-testid='error-toast-text'
            >
                {text}
            </div>
            {(isClamped || isExpanded) && (
                // A bare button on purpose: every module that reports an error imports
                // notifyError, and reaching for the Button primitive would pull the UI-kit
                // facade into all of them (error subscribers and command executors
                // included) for one text link.
                <button
                    type='button'
                    className='ocErrorToastToggle'
                    onClick={() => setIsExpanded(current => !current)}
                    data-testid='error-toast-toggle'
                >
                    {t(isExpanded ? 'showLess' : 'showMore')}
                </button>
            )}
        </>
    )
}

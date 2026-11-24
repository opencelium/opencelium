import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Closes the hosting dialog once the route changes, e.g. after a link inside it is clicked.
 * Dialogs are stacked above the router outlet, so they would otherwise stay over the new page.
 */
export function useCloseOnNavigate(close: () => void) {
    const { pathname } = useLocation()
    const openedOn = useRef(pathname)

    useEffect(() => {
        if (pathname !== openedOn.current) close()
    }, [pathname, close])
}

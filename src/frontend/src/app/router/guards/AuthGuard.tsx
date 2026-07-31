import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {useAuth} from "@features/auth/useAuth.ts";
import {LoadingScreen} from "@shared/ui/feedback/LoadingScreen";
import {useAppSelector} from "@shared/lib/storeHooks";
import {selectIntentionalLogout} from "@entities/auth/model/authSelectors";

export function AuthGuard() {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()
    const intentional = useAppSelector(selectIntentionalLogout)

    if (isLoading) return <LoadingScreen />
    if (!isAuthenticated) {
        // Keep the loader on screen for the single render between session-cleared
        // and the URL flipping to /login — otherwise the layout (or a blank frame)
        // briefly flashes through. Intentional logout skips the `from` so the
        // user lands on / after the next sign-in; involuntary logouts (expired
        // token, FORCE_LOGOUT, etc.) keep `from` so the user returns to where
        // they were.
        return (
            <>
                <LoadingScreen />
                <Navigate
                    to="/login"
                    replace
                    state={intentional ? undefined : { from: location }}
                />
            </>
        )
    }

    return <Outlet />
}

import {AppProviders} from "@app/providers/AppProviders.tsx";
import {AppRouter} from "@app/router/AppRouter.tsx";


export default function App() {
    return (
        <AppProviders>
            <AppRouter />
        </AppProviders>
    )
}

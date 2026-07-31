import { Provider } from 'react-redux'
import React from "react";
import {store} from "@app/store/store.ts";

export function StoreProvider({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
}

import {createContext} from "react"
import type {SocketContextValue} from "./types"

export const SocketContext = createContext<SocketContextValue>({
    client: null,
    status: 'idle',
    error: null,
})

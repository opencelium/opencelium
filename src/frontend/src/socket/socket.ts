import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {Urls} from "@entity/application/requests/classes/url";
import {store} from "@application/utils/store";
import {consoleLog} from "@application/utils/utils";

let socketClient: Client | null = null;

export const SocketAppPrefix = '/oc';

export const getSocket = () => {
    const token = store.getState().authReducer.authUser?.token;
    if (!socketClient && token) {
        const webSocket = new SockJS(`${Urls.socketServer}?token=${token}`);
        socketClient = new Client({
            webSocketFactory: () => webSocket,
            reconnectDelay: 5000,
            connectHeaders: {
                "client-id": `${Date.now()}-${Math.random()}`,
            },
            onConnect: () => {
                consoleLog('Socket connected');
            },
            onDisconnect: () => {
                consoleLog('Socket disconnected');
            },
            debug: (str: string) => {
                consoleLog('[STOMP DEBUG]', str);
            },

            // Optional: catch WebSocket/STOMP errors
            onStompError: (frame) => {
                console.error('[STOMP ERROR]', frame.headers['message'], frame.body);
            },

            onWebSocketError: (event) => {
                console.error('[WS ERROR]', event);
            },
        });
        consoleLog('SocketClient.Init', socketClient);
    }
    return socketClient;
};

export const disableSocket = async () => {
    if (socketClient) {
        socketClient.reconnectDelay = 0;
        await socketClient.deactivate();
        socketClient = null;
    }
}

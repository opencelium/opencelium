import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {Urls} from "@entity/application/requests/classes/url";
import {store} from "@application/utils/store";

let socketClient: Client | null = null;

export const SocketAppPrefix = '/oc';
export const SocketUserPrefix = '/user';

export const getSocket = () => {
    const token = store.getState().authReducer.authUser?.token;
    if (!socketClient && token) {
        const webSocket = new SockJS(`${Urls.socketServer}websocket?token=${token}`);
        socketClient = new Client({
            webSocketFactory: () => webSocket,
            reconnectDelay: 5000,
            debug: (str: string) => {
                console.log('[STOMP DEBUG]', str);
            },

            // Optional: catch WebSocket/STOMP errors
            onStompError: (frame) => {
                console.error('[STOMP ERROR]', frame.headers['message'], frame.body);
            },

            onWebSocketError: (event) => {
                console.error('[WS ERROR]', event);
            },
        });
        console.log('SocketClient.Init', socketClient);
    }
    return socketClient;
};

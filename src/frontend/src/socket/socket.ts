import { io, Socket } from "socket.io-client";
import {Urls} from "@entity/application/requests/classes/url";
import {store} from "@application/utils/store";

let socket: Socket | null = null;

export const getSocket = () => {
    const token = store.getState().authReducer.authUser?.token;
    if (!socket && token) {
        socket = io(`${Urls.baseUrl}websocket?token=${token}`, {
            transports: ["websocket"],
            autoConnect: false,
            /*auth: {
                token: localStorage.getItem("auth_token"),
            },*/
        });
    }
    return socket;
};

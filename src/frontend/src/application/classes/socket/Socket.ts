/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import SockJS from 'sockjs-client';
import {Client, over, Frame, Message, Subscription} from 'stompjs';
import ConnectionLogs from "./ConnectionLogs";

export default class CSocket{

    private static url: string = 'http://localhost:9090/websocket'

    public client: Client = null;

    public subscribe: {[name: string]: (callback: (message: Message) => void) => void} = {
        ConnectionLogs: (callback: (message: Message) => void) => ConnectionLogs.subscribe(this, callback),
    }

    public unsubscribe: {[name: string]: () => void} = {
        ConnectionLogs: ConnectionLogs.unsubscribe,
    }

    constructor(client: Client) {
        this.client = client;
    }

    static createSocket(token: string, params: string = ''): CSocket {
        const socket = new SockJS(`${this.url}?token=${token}${params}`);
        const client = over(socket);
        return new CSocket(client)
    }

    connect(callback: (frame: Frame) => void): void{
        if(this.client){
            this.client.connect({}, callback);
        }
    }

    _subscribe(messageName: string, callback: (message: Message) => void, post?: (subscription: Subscription) => void): void{
        this.connect((frame: Frame) => {
            if(this.client){
                const subscription = this.client.subscribe(messageName, callback);
                if(post){
                    post(subscription);
                }
            }
        });
    }

    _unsubscribe(id: string): void{
        if(this.client){
            this.client.unsubscribe(id);
        }
    }

    disconnect(): void{
        if(this.client){
            this.client.disconnect(() => {});
        }
    }
}

export {
    Message, Subscription, Client,
}
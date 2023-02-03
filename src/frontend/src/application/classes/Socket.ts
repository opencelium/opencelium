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
import {Client, over, Frame, Message} from 'stompjs';

export default class CSocket{

    private static url: string = 'http://localhost:9090/websocket'
    public client: Client = null;

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

    subscribe(messageName: string, callback: (message: Message) => void): void{
        this.connect((frame: Frame) => {
            this.client.subscribe(messageName, callback);
        });
    }

    disconnect(): void{
        if(this.client){
            this.client.disconnect(() => {});
        }
    }
}
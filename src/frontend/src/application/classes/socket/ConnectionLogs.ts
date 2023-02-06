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

import Socket, { Message, Subscription } from "./Socket";

export default class ConnectionLogs {

    static message: string = '/execution/logs';

    static BreakMessage: string = '============================================================================';

    static subscription: Subscription = null;

    static subscribe(socket: Socket, callback: (message: Message) => void): void{
        socket._subscribe(this.message, callback, (subscription: Subscription) => {this.subscription = subscription;});
    }

    static unsubscribe(): void{
        if(this.subscription){
            this.subscription.unsubscribe()
        }
    }

    static parseMessage(data: Message): any{
        const log = JSON.parse(data.body.toString());
        let message = log && log.message ? log.message : '';
        const indexSplit = message.split(' -- index: ');
        let index = '';
        if(indexSplit.length > 1){
            index = indexSplit[1];
            message = indexSplit[0];
        }
        const backgroundColorSplit = message.split(' -- color: ');
        let backgroundColor = '#fff';
        if(backgroundColorSplit.length > 1){
            backgroundColor = backgroundColorSplit[1].substring(0, 7);
            backgroundColorSplit[1] = backgroundColorSplit[1].substring(7);
            message = backgroundColorSplit.join('');
        }
        return {
            index,
            message,
            connectorType: 'fromConnector',
            backgroundColor,
        }
    }

}
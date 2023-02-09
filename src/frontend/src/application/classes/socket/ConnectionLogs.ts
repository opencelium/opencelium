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
import {ConnectionLogProps} from "@root/interfaces/IConnection";

export default class ConnectionLogs {

    static message: string = '/execution/logs';

    static BreakMessage: string = '============================================================================';

    static MethodResponseMessage: string = '============================================================';

    static subscription: Subscription = null;

    static subscribe(socket: Socket, callback: (message: Message) => void): void{
        socket._subscribe(this.message, callback, (subscription: Subscription) => {this.subscription = subscription;});
    }

    static unsubscribe(): void{
        if(this.subscription){
            this.subscription.unsubscribe()
        }
    }

    static parseMessage(data: Message): ConnectionLogProps{
        const log = JSON.parse(data.body.toString());
        let message = log && log.message ? log.message : '';
        const indexSplit = message.split(' -- index: ');
        let index = '';
        if(indexSplit.length > 1){
            index = indexSplit[1];
        }
        const methodColorSplit = message.split(' -- color: ');
        let methodColor = '';
        if(methodColorSplit.length > 1){
            methodColor = methodColorSplit[1].substring(0, 7);
            methodColorSplit[1] = methodColorSplit[1].substring(7);
        }
        let operatorData: any = null;
        const methodData = {color: methodColor};
        if(message.substr(0, 9) === 'Operator:'){
            operatorData = {};
            operatorData.isNextMethodOutside = true;
        }
        const nextFunctionSplit = message.split(' -- next function: ');
        let isNextFunctionNull = false;
        if(nextFunctionSplit.length > 1){
            isNextFunctionNull = nextFunctionSplit[1].substring(0, 4) === 'null';
        }
        const nextOperatorSplit = message.split(' -- next operator: ');
        let isNextOperatorNull = false;
        if(nextOperatorSplit.length > 1){
            isNextOperatorNull = nextOperatorSplit[1].substring(0, 4) === 'null';
        }
        return {
            index,
            message,
            connectorType: 'fromConnector',
            hasNextItem: !(isNextFunctionNull && isNextOperatorNull),
            methodData,
            operatorData,
        }
    }

}
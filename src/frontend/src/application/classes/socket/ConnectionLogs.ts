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
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem, {CONNECTOR_FROM} from "@classes/content/connection/CConnectorItem";

export default class ConnectionLogs {

    static message: string = '/execution/logs';

    static BreakMessage: string = '============================================================================';

    static MethodResponseMessage: string = '============================================================';

    static OperatorResultFlag: string = 'OPERATOR_RESULT: ';

    static EndOfExecutionMessage: string = '======================END_OF_EXECUTION======================';

    static subscription: Subscription = null;

    static subscribe(socket: Socket, callback: (message: Message) => void): void{
        socket._subscribe(this.message, callback, (subscription: Subscription) => {this.subscription = subscription;});
    }

    static unsubscribe(): void{
        if(this.subscription){
            this.subscription.unsubscribe()
        }
    }

    static parseMessage(connection: CConnection, data: Message): ConnectionLogProps{
        const log = JSON.parse(data.body.toString());
        const connector = log.connector && log.connector.dir ? log.connector.dir === 'from' ? connection.fromConnector : connection.toConnector : null;
        let message = log && log.message ? log.message : '';
        const indexSplit = message.split(' -- index: ');
        let index = '';
        if(indexSplit.length > 1){
            index = indexSplit[1];
        }
        let methodColor = log?.methodData?.color || '';
        let operatorData: any = null;
        const methodData = {color: methodColor};
        if(message.substr(0, 9) === 'Operator:'){
            operatorData = {};
            operatorData.isNextMethodOutside = true;
            operatorData.conditionResult = true;
        }
        if(message.indexOf(ConnectionLogs.OperatorResultFlag) === 0){
            if(message.substring(ConnectionLogs.OperatorResultFlag.length, ConnectionLogs.OperatorResultFlag.length + 5) === 'FALSE'){
                if(!operatorData){
                    operatorData = {};
                }
                operatorData.conditionResult = false;
            } else{
                if(!operatorData){
                    operatorData = {};
                }
                operatorData.conditionResult = true;
            }
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
        if(index) {
            const operator = connector.getOperatorByIndex(index);
            if (operator) {
                message = operator.condition.generateStatementText(true)
            }
        }
        const isMethod = connection.isItemMethodByIndex(connector.getConnectorType(), index);
        const isOperator = connection.isItemOperatorByIndex(connector.getConnectorType(), index);
        return {
            index,
            message,
            connectorType: connector.getConnectorType(),
            hasNextItem: !(isNextFunctionNull && isNextOperatorNull),
            methodData,
            operatorData,
            isMethod,
            isOperator,
            type: log.type,
        }
    }

}

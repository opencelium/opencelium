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


import React, {FC} from "react";
import Text from "@app_component/base/text/Text";
import { MessageStyled, ResponseMessage, } from './styles';
import ReactJson from "react-json-view";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";

const LogMessage: FC<React.HTMLAttributes<HTMLDivElement> & {message: string, index: number}> = ({ index, message, ...props}) => {
    let jsonLabel = '';
    let isJson = false;
    let json = null;
    const responseSplit = message.split('Response : ');
    const bodySplit = message.split('Body: ');
    if(responseSplit.length > 1){
        jsonLabel = 'Response: ';
        isJson = true;
        json = JSON.parse(responseSplit[1]);
    }
    if(bodySplit.length > 1){
        jsonLabel = 'Body: ';
        isJson = true;
        json = JSON.parse(bodySplit[1]);
    }
    if(message === ConnectionLogs.MethodResponseMessage){
        return null;
    }
    if(isJson){
        return (
            <ResponseMessage>
                <Text value={jsonLabel} isBold display={'block'}/>
                <ReactJson
                    name={false}
                    collapsed={true}
                    src={json}
                    style={{wordBreak: 'break-word', padding: '8px 0', width: '80%', display: 'inline-block', position: 'relative'}}
                />
            </ResponseMessage>
        );
    }
    return (
        <MessageStyled {...props}>{message}</MessageStyled>
    )
}

export default LogMessage;

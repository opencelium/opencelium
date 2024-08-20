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

import GraphiQLRequest from "@root/components/classes/graphiql/GraphiQLRequest";
import {ApplicationRequest} from "@application/requests/classes/Application";
import {
    RemoteApiRequestProps,
    RemoteApiResponseProps,
    REQUEST_METHOD
} from "@application/requests/interfaces/IApplication";
import {AxiosResponse} from "axios";
import { GraphQLRequestProps } from "@entity/connection/requests/interfaces/IGraphQL";

export default class GraphiQLRequestWithDynamicToken extends GraphiQLRequest {

    async query({url, accessToken, sslOn, ...body}: GraphQLRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>> {
        const requestProps: RemoteApiRequestProps = {
            body,
            header: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "crossDomain": "1"
            },
            method: REQUEST_METHOD.POST,
            url: url,
            sslOn,
        }
        const Request = new ApplicationRequest();
        return Request.remoteApiRequest(requestProps);
    }

    async login(connector: any): Promise<string> {
        const request = new ApplicationRequest();
        let tokenReference = connector.invoker.requiredData.token;
        if(tokenReference) {
            tokenReference = tokenReference.substring(2, tokenReference.length - 1);
            const referenceData = tokenReference.split('.');
            if(referenceData.length > 2) {
                const operationName = referenceData[0];
                referenceData.shift();
                referenceData.shift();
                const pathToToken = referenceData;
                const loginOperation = connector.invoker.operations.find((o: any) => o.name === operationName)
                const operationData = loginOperation.request.body.fields;
                let variables: any = {};
                for(let param in operationData.variables){
                    const value = operationData.variables[param];
                    if(value && value[0] === '{' && value[value.length - 1] === '}'){
                        variables[param] = connector.requestData[value.substring(1, value.length - 1)];
                    } else{
                        variables[param] = connector.requestData[param];
                    }
                }
                //do variables
                const loginProps: RemoteApiRequestProps = {
                    body: {
                        query: operationData.query,
                        variables,
                    },
                    header: {
                        "Content-Type": "application/json",
                    },
                    method: REQUEST_METHOD.POST,
                    url: connector.requestData.url,
                    sslOn: connector.sslCert,
                }
                const response = await request.remoteApiRequest(loginProps);
                let accessToken = JSON.parse(response.data.body);
                for(let i = 0; i < pathToToken.length; i++){
                    if(!accessToken.hasOwnProperty(pathToToken[i])){
                        accessToken = '';
                        break;
                    }
                    accessToken = accessToken[pathToToken[i]];
                }
                return accessToken;
            }
        }
        return '';
    }
}

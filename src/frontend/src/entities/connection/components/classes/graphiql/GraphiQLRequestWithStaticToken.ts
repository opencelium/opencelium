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
import {GraphQLRequestProps} from "@root/requests/interfaces/IGraphQL";
import {AxiosResponse} from "axios";
import {
    RemoteApiRequestProps,
    RemoteApiResponseProps,
    REQUEST_METHOD
} from "@application/requests/interfaces/IApplication";
import {ApplicationRequest} from "@application/requests/classes/Application";

export default class GraphiQLRequestWithStaticToken extends GraphiQLRequest {

    async query({url, accessToken, sslOn, ...body}: GraphQLRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>> {
        const requestProps: RemoteApiRequestProps = {
            body,
            header: {
                "Content-Type": "application/json",
                "Authorization": `Token ${accessToken}`,
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
        return connector.requestData.token;
    }
}
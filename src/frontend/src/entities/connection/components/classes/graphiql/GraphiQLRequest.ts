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


import {AxiosResponse} from "axios";
import {RemoteApiResponseProps} from "@application/requests/interfaces/IApplication";
import { GraphQLRequestProps } from "@entity/connection/requests/interfaces/IGraphQL";


export default class GraphiQLRequest{

    async login(connector: any): Promise<string>{
        throw new Error('login method must be implemented');
    }

    async query(data: GraphQLRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>>{
        throw new Error('query method must be implemented');
    }

}
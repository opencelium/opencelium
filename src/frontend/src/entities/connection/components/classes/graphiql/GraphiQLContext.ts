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
import GraphiQLRequestWithDynamicToken from "@root/components/classes/graphiql/GraphiQLRequestWithDynamicToken";
import GraphiQLRequestWithStaticToken from "@root/components/classes/graphiql/GraphiQLRequestWithStaticToken";
import { GraphQLRequestProps } from "@entity/connection/requests/interfaces/IGraphQL";

export default class GraphiQLContext {

    strategy: GraphiQLRequest;

    constructor(connector: any) {
        if(connector.invoker.requiredData.token === ''){
            this.strategy = new GraphiQLRequestWithStaticToken();
        } else{
            this.strategy = new GraphiQLRequestWithDynamicToken();
        }
    }

    setStrategy(strategy: GraphiQLRequest) {
        this.strategy = strategy;
    }

    async login(connector: any): Promise<string> {
        return await this.strategy.login(connector);
    }

    async query(data: GraphQLRequestProps) {
        return await this.strategy.query(data);
    }
}
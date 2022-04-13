/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "../../../components/utils";
import {ApplicationRequest} from "@request/application/Application";
import {RemoteApiRequestProps} from "@requestInterface/application/IApplication";
import { REQUEST_METHOD } from "@model/invoker/Request";
import {GraphQLLoginProps, GraphQLRequestProps} from "@requestInterface/graphql/IGraphQL";


export const graphQLRequest = ({accessToken, url, ...body}: GraphQLRequestProps) => {
    const requestProps: RemoteApiRequestProps = {
        body: body,
        header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "crossDomain": "1"
        },
        method: REQUEST_METHOD.POST,
        url: url,
    }
    const Request = new ApplicationRequest();
    return Request.remoteApiRequest(requestProps);
}

export const graphQLLogin = createAsyncThunk(
    'graphQL/login',
    async(data: GraphQLLoginProps, thunkAPI) => {
        try {
            const {url, user, password} = data;
            const request = new ApplicationRequest();
            const loginProps: RemoteApiRequestProps = {
                body: {
                    query: "mutation($user: String, $password: String) {authentication { login(login: $user, password: $password){ status accessToken refreshToken }}}",
                    variables: {
                        user,
                        password,
                    }
                },
                header: {
                    "Content-Type": "application/json",
                },
                method: REQUEST_METHOD.POST,
                url,
            }
            const response = await request.remoteApiRequest(loginProps);
            return JSON.parse(response.data.body);
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect, useState} from 'react';
import GraphiQL from "graphiql";
import {FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types";
import {useAppDispatch} from "@application/utils/store";
import {GraphQL} from "@entity/connection/classes/GraphQL";
import {graphQLLogin, graphQLRequest} from "@entity/connection/redux_toolkit/action_creators/GraphQLCreators";
// @ts-ignore
import {GraphQLRequestProps} from "../@requestInterface/graphql/IGraphQL";
import {GraphiQLEditorProps} from "@entity/connection/components/graphiql_editor/interfaces";
import {GraphiQLEditorStyled} from "@entity/connection/components/graphiql_editor/styles";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Loading from "@app_component/base/loading/Loading";

const GraphiQLEditor: FC<GraphiQLEditorProps> =
    ({
        query,
        update,
        readOnly,
        credentials,
        connector,
    }) => {
        const dispatch = useAppDispatch();
        const {accessToken, logining} = GraphQL.getReduxState();
        const [shouldRevokeToken, setShouldRevokeToken] = useState(false);
        const {url, user, password} = credentials;
        const sslOn = connector.sslCert;
        useEffect(() => {
            dispatch(graphQLLogin({url, user, password, sslOn}));
        }, []);
        useEffect(() => {
            if(shouldRevokeToken && logining !== API_REQUEST_STATE.ERROR){
                dispatch(graphQLLogin({url, user, password, sslOn}));
                setShouldRevokeToken(false);
            }
        }, [shouldRevokeToken]);
        useEffect(() => {
            if(logining === API_REQUEST_STATE.FINISH && query !== ''){
                const executeButton: HTMLButtonElement = document.querySelector('div.execute-button-wrap > button');
                if(executeButton){
                    executeButton.click();
                }
            }
        }, [logining])
        const graphQLFetcher = (graphQLParams: FetcherParams) => {
            const requestProps: GraphQLRequestProps = {url, accessToken, sslOn, ...graphQLParams};
            return graphQLRequest(requestProps).then((response: any) => {
                const result = JSON.parse(response.data.body);
                if(result && result.errors && result.errors.length > 0 && result.errors[0].extensions && result.errors[0].extensions.causes && result.errors[0].extensions.causes.length > 0 &&  result.errors[0].extensions.causes[0].error){
                    if(result.errors[0].extensions.causes[0].error === 'AccessDeniedException'){
                        setShouldRevokeToken(true);
                        return {};
                    }
                }
                return result;
            }).catch((error) => {
                console.log(error);
            });
        }
        const generateQuery = (query: string) => {
            let result = {query: query};
            update(result);
        }
        if(logining === API_REQUEST_STATE.ERROR){
            return <div>Please, check your connection</div>;
        }
        if(accessToken === '' || logining === API_REQUEST_STATE.START){
            return <div style={{height: '100%', display: 'grid', placeItems: 'center'}}><Loading/></div>;
        }
        return (
            <GraphiQLEditorStyled>
                <GraphiQL query={query} fetcher={graphQLFetcher} onEditQuery={generateQuery} readOnly={readOnly}/>
            </GraphiQLEditorStyled>
        )
    }

GraphiQLEditor.defaultProps = {
    readOnly: false,
}


export {
    GraphiQLEditor,
};

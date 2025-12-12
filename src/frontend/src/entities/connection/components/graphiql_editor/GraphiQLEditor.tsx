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

import React, {FC, useEffect, useState} from 'react';
import GraphiQL from "graphiql";
import {FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types";
import {useAppDispatch} from "@application/utils/store";
import {GraphQL} from "@entity/connection/classes/GraphQL";
import {graphQLLogin} from "@entity/connection/redux_toolkit/action_creators/GraphQLCreators";
// @ts-ignore
import {GraphQLRequestProps} from "../@requestInterface/graphql/IGraphQL";
import {GraphiQLEditorProps} from "@entity/connection/components/graphiql_editor/interfaces";
import {GraphiQLEditorStyled, ShortcutStyled, MasterPasswordContainer} from "@entity/connection/components/graphiql_editor/styles";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Loading from "@app_component/base/loading/Loading";
import GraphiQLContext from "@root/components/classes/graphiql/GraphiQLContext";
import Hint from "@app_component/base/hint/Hint";
import MasterPasswordInput from "@entity/connector/components/master_password_input/MasterPasswordInput";
import {Connector} from "@entity/connector/classes/Connector";
import {getConnectorById} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";

const GraphiQLEditor: FC<GraphiQLEditorProps> =
    ({
        query,
        update,
        readOnly,
        connector,
    }) => {
        const dispatch = useAppDispatch();
        const {accessToken, logining} = GraphQL.getReduxState();
        const {masterPassword, currentConnector, gettingConnector} = Connector.getReduxState();
        const [shouldRevokeToken, setShouldRevokeToken] = useState(false);
        const [startGettingConnector, setStartGettingConnector] = useState<boolean>(false);
        const [startLogining, setStartLogining] = useState<boolean>(true);
        const sslOn = connector.sslCert;
        useEffect(() => {
            if (masterPassword) {
                dispatch(getConnectorById(connector.connectorId));
                setStartGettingConnector(true);
            } else {
                setStartLogining(false);
            }
        }, [masterPassword]);
        useEffect(() => {
            if (startGettingConnector && gettingConnector === API_REQUEST_STATE.FINISH) {
                setStartGettingConnector(false);
                dispatch(graphQLLogin(currentConnector));
            }
        }, [gettingConnector])
        useEffect(() => {
            if(shouldRevokeToken && logining !== API_REQUEST_STATE.ERROR){
                dispatch(graphQLLogin(currentConnector));
                setShouldRevokeToken(false);
            }
        }, [shouldRevokeToken]);
        useEffect(() => {
            if(logining === API_REQUEST_STATE.FINISH){
                setStartLogining(false);
                if (query !== '') {
                    const executeButton: HTMLButtonElement = document.querySelector('div.execute-button-wrap > button');
                    if (executeButton) {
                        executeButton.click();
                    }
                }
            }
            if (logining === API_REQUEST_STATE.ERROR) {
                setStartLogining(false);
            }
        }, [logining])
        const graphQLFetcher = async (graphQLParams: FetcherParams) => {
            if (currentConnector) {
                const requestProps: GraphQLRequestProps = {
                    url: currentConnector.requestData.url,
                    accessToken,
                    sslOn, ...graphQLParams
                };
                let request = new GraphiQLContext(currentConnector);
                const response = await request.query(requestProps);
                const result: any = response.data;
                if (result && result.errors && result.errors.length > 0 && result.errors[0].extensions && result.errors[0].extensions.causes && result.errors[0].extensions.causes.length > 0 && result.errors[0].extensions.causes[0].error) {
                    if (result.errors[0].extensions.causes[0].error === 'AccessDeniedException') {
                        setShouldRevokeToken(true);
                        return {};
                    }
                }
                return result;
            }
        }
        const generateQuery = (query: string) => {
            let result = {query: query};
            update(result);
        }
        if(logining === API_REQUEST_STATE.ERROR){
            return <div>Please, check your connection</div>;
        }
        if(startLogining){
            return <div style={{height: '100%', display: 'grid', placeItems: 'center'}}><Loading/></div>;
        }
        if (!startLogining && accessToken === '' && !masterPassword) {
            return <MasterPasswordContainer><MasterPasswordInput onSuccess={() => {}}/></MasterPasswordContainer>;
        }
        return (
            <GraphiQLEditorStyled>
                <GraphiQL query={query} fetcher={graphQLFetcher} onEditQuery={generateQuery} readOnly={readOnly}/>
                <Hint style={{marginTop: 15}} message={<span>
                    <span>{`Press `}</span>
                    <ShortcutStyled>{`Ctrl`}</ShortcutStyled>
                    <span>{` + `}</span>
                    <ShortcutStyled>{`Space`}</ShortcutStyled>
                    <span>{` to see the autocomplete.`}</span>
                </span>
                }/>
            </GraphiQLEditorStyled>
        )
    }

GraphiQLEditor.defaultProps = {
    readOnly: false,
}


export {
    GraphiQLEditor,
};

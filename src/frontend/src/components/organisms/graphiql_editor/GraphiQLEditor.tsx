import React, {FC, useEffect, useState} from 'react';
import GraphiQL from "graphiql";
import {FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types";
import {useAppDispatch} from "../../../hooks/redux";
import {GraphQL} from "@class/graphql/GraphQL";
import {graphQLLogin, graphQLRequest} from "@action/graphql/GraphQLCreators";
import Loading from "@molecule/loading/Loading";
// @ts-ignore
import {GraphQLRequestProps} from "../@requestInterface/graphql/IGraphQL";
import {GraphiQLEditorProps} from "@organism/graphiql_editor/interfaces";
import {GraphiQLEditorStyled} from "@organism/graphiql_editor/styles";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

const GraphiQLEditor: FC<GraphiQLEditorProps> =
    ({
        query,
        update,
        readOnly,
        credentials,
    }) => {
        const dispatch = useAppDispatch();
        const {accessToken, logining} = GraphQL.getReduxState();
        const [shouldRevokeToken, setShouldRevokeToken] = useState(false);
        const {url, user, password} = credentials;
        useEffect(() => {
            dispatch(graphQLLogin({url, user, password}));
        }, []);
        useEffect(() => {
            if(shouldRevokeToken && logining !== API_REQUEST_STATE.ERROR){
                dispatch(graphQLLogin({url, user, password}));
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
            const requestProps: GraphQLRequestProps = {url, accessToken, ...graphQLParams};
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

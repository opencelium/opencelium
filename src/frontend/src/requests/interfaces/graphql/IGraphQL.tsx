import {FetcherParams} from "@graphiql/toolkit/src/create-fetcher/types";

export interface IGraphQLCredentials{
    user: string,
    password: string,
}

export interface GraphQLLoginProps extends IGraphQLCredentials{
    url: string,
}

export interface GraphQLRequestProps extends FetcherParams{
    url: string,
    accessToken: string,
}
export interface GraphQLLoginResponseProps{

}
import {GraphQLLoginProps} from "@requestInterface/graphql/IGraphQL";

interface GraphiQLEditorProps{
    update: ({query}: {query: string}) => void,
    query: string,
    readOnly?: boolean,
    credentials: GraphQLLoginProps,
}

export {
    GraphiQLEditorProps,
}
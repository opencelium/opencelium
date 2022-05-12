import ActionCreators from "../../redux_toolkit/action_creators";

const {
    checkNeo4j, checkElasticsearch, checkAllExternalApplications
} = ActionCreators;

export default {
    fulfilled: {
    },
    rejected: {
        [checkNeo4j.rejected.type]: {
            "DOWN": "Neo4j is down",
            "__DEFAULT__": "Neo4j could not be checked"
        },
        [checkElasticsearch.rejected.type]: {
            "DOWN": "Elasticsearch is down",
            "__DEFAULT__": "Neo4j could not be checked"
        },
    },
}
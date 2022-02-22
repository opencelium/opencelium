import GraphiQL from "graphiql";
import React from "react";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Loading from "@components/general/app/Loading";
import {loginGraphQL} from "@actions/connections/fetch";
import {baseUrlApi} from "@utils/constants/url";
import {getCryptLS} from "@utils/LocalStorage";

function mapStateToProps(state){
    const connection = state.get('connections');
    return{
        accessToken: connection.get('graphQLAccessToken'),
    }
}

@connect(mapStateToProps, {loginGraphQL})
class GraphiQLEditor extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const {user, password, url} = this.props.credentials;
        const props = {
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
            method: 'POST',
            endpoint: url,
        }
        this.props.loginGraphQL(props);
    }

    graphQLFetcher(graphQLParams){
        const {credentials, accessToken} = this.props;
        const requestProps = {
            body: graphQLParams,
            header: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            method: 'POST',
            url: credentials.url,
        }
        return fetch(`${baseUrlApi}connection/remoteapi/test`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getCryptLS('token'),
                "crossDomain": "1"
            },
            body: JSON.stringify(requestProps)
        }).then(response => response.json().then((data) => {
            return JSON.parse(data.body);
        }));
    }

    generateQuery(query){
        let result = {query: query};
        this.props.update(result);
    }

    render(){
        const {query, accessToken, readOnly} = this.props;
        if(accessToken === ''){
            return <Loading/>;
        }
        return(
            <div style={{height: 'calc(100% - 20px)', margin: '10px 0', width: '100%'}}>
                <GraphiQL query={query} fetcher={::this.graphQLFetcher} onEditQuery={::this.generateQuery} readOnly={readOnly}/>
            </div>
        );
    }
}

GraphiQLEditor.propTypes = {
    update: PropTypes.func.isRequired,
    query: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    credentials: PropTypes.object.isRequired,
}

GraphiQLEditor.defaultProps = {
    readOnly: false,
    credentials: {
        url: '',
        user: '',
        password: '',
    }
}

export default GraphiQLEditor;
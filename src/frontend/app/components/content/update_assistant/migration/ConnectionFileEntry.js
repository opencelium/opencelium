import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/content/update_assistant/main";
import CExecution from "@classes/components/content/template_converter/CExecution";
import {connect} from "react-redux";
import Loading from "@loading";

function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
    }
}

@connect(mapStateToProps, {})
class ConnectionFileEntry extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            ::this.convertConnection();
        }
    }

    convertConnection(){
        const {index, connection, entity, setConnection} = this.props;
        let convertedConnection = null;
        let status = null;
        const {jsonData, error} = CExecution.executeConfig({
            fromVersion: connection.version,
            toVersion: entity.availableUpdates.selectedVersion
        }, connection);
        if (error.message !== '') {
        //if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedConnection = {name: connection.title, description: '', connection: jsonData, version: entity.availableUpdates.selectedVersion};
        setTimeout(() => {
            setConnection(convertedConnection, status, index);
        }, 100);
    }

    render(){
        const {convertedConnections, index, isConverting, connection} = this.props;
        let isFail = false;
        let isSuccess = false;
        if(typeof convertedConnections[index] !== 'undefined'){
            isFail = convertedConnections[index].status !== null;
            isSuccess = convertedConnections[index].status === null;
        }
        return(
            <tr key={connection.title}>
                <td>{connection.title}</td>
                <td>
                    {!isConverting && !isFail && !isSuccess && <span>-</span>}
                    {isConverting && <Loading className={styles.convert_loading}/>}
                    {isSuccess && <FontIcon value={'done'} size={18} className={styles.convert_success}/>}
                    {isFail && <FontIcon value={'close'} size={18} className={styles.convert_fail}/>}
                </td>
            </tr>
        );
    }
}

ConnectionFileEntry.defaultProps = {
    isConverting: false,
    status: null,
};

ConnectionFileEntry.propTypes = {
    index: PropTypes.number.isRequired,
    isConverting: PropTypes.bool,
    connection: PropTypes.object.isRequired,
    setConnection: PropTypes.func.isRequired,
};

export default ConnectionFileEntry;
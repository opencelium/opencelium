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

import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import CExecution from "@entity/connection/components/classes/components/content/template_converter/CExecution";
import {connect} from "react-redux";
import Loading from "@loading";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const application = state.applicationReducer;
    return {
        authUser,
        appVersion: application.version,
    }
}

@connect(mapStateToProps, {})
class ConnectionFileEntry extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            this.convertConnection();
        }
    }

    convertConnection(){
        const {index, connection, entity, setConnection} = this.props;
        let convertedConnection = null;
        let status = null;
        const {jsonData, error} = CExecution.executeConfig({
            fromVersion: connection.version,
            toVersion: entity.availableUpdates.selectedVersion.name,
        }, connection);
        if (error.message !== '') {
        //if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedConnection = JSON.stringify({name: connection.title, description: '', connection: jsonData, version: entity.availableUpdates.selectedVersion.name});
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
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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import TechnicalLayout from "./layouts/TechnicalLayout";

import Details from "./details/Details";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {PANEL_LOCATION} from "@entity/connection/components/utils/constants/app";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import CreateElementPanel from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateElementPanel";
import {setCurrentTechnicalItem, setConnectionData, clearCurrentLogs} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {LocalStorage} from "@application/classes/LocalStorage";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import LogPanel from "@change_component/form_elements/form_connection/form_svg/layouts/logs/LogPanel";
import {OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";
import {CREATE_PROCESS} from "@classes/content/connection_overview_2/CCreateElementPanel";


export const HAS_LAYOUTS_SCALING = true;


function mapStateToProps(state){
    const isFullScreen = state.applicationReducer.isFullScreen;
    const authUser = state.authReducer.authUser;
    const connectionOverview = state.connectionReducer;
    const {currentTechnicalItem, connection} = mapItemsToClasses(state);
    return{
        authUser,
        technicalLayoutLocation: connectionOverview.technicalLayoutLocation,
        currentTechnicalItem,
        connection,
        isFullScreen,
    };
}

/**
 * Form for ConnectionSvg
 */
@withTranslation('basic_components')
@connect(mapStateToProps, {setCurrentTechnicalItem, setConnectionData, clearCurrentLogs})
class FormConnectionSvg extends Component{

    constructor(props){
        super(props);
        this.state = {
            isCreateElementPanelOpened: false,
            createElementPanelConnectorType: '',
            createElementPanelPosition: {x: 0, y: 0},
        }
    }

    setCreateElementPanelPosition(position){
        this.setState({
            createElementPanelPosition: position,
        });
    }

    setIsCreateElementPanelOpened(isCreateElementPanelOpened, createElementPanelConnectorType = ''){
        this.setState({
            isCreateElementPanelOpened,
            createElementPanelConnectorType,
        });
    }

    componentDidMount() {
        const {entity, setConnectionData} = this.props;
        let connectionData = entity instanceof CConnection ? entity.getObjectForConnectionOverview() : entity;
        setConnectionData({connection: connectionData});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {entity, setConnectionData} = this.props;
        if(prevProps.entity.id !== this.props.entity.id){
            let connectionData = entity instanceof CConnection ? entity.getObjectForConnectionOverview() : entity;
            setConnectionData({connection: connectionData});
        }
    }

    componentWillUnmount() {
        const {setCurrentTechnicalItem, currentTechnicalItem, clearCurrentLogs} = this.props;
        if(currentTechnicalItem !== null) setCurrentTechnicalItem(null);
        clearCurrentLogs();
    }

    updateEntity(entity = null, settings = {hasPostMessage: true}){
        const {authUser, connection, updateEntity, setConnectionData} = this.props;
        if(connection) {
            const storage = LocalStorage.getStorage();
            storage.set(`${connection.fromConnector.invoker.name}&${connection.toConnector.invoker.name}`, JSON.stringify(connection.getObject()));
            if (entity !== null) {
                let connectionData = entity instanceof CConnection ? entity.getObjectForConnectionOverview() : entity;
                updateEntity(entity);
                setConnectionData({connection: connectionData});
            }
        }
    }

    render(){
        const {data, connection, currentTechnicalItem, isFullScreen} = this.props;
        const {
            isCreateElementPanelOpened, createElementPanelConnectorType, createElementPanelPosition,
        } = this.state;
        return (
            <div className={`${styles.connection_editor}`} style={{padding: isFullScreen ? '0 0 0 15px' : '0'}}>
                <Details
                    readOnly={data.readOnly}
                    updateConnection={(a, b) => this.updateEntity(a, b)}
                    data={data}
                />
                <TechnicalLayout
                    readOnly={data.readOnly}
                    setIsCreateElementPanelOpened={(a, b) => this.setIsCreateElementPanelOpened(a, b)}
                    isCreateElementPanelOpened={isCreateElementPanelOpened}
                    createElementPanelConnectorType={createElementPanelConnectorType}
                    setCreateElementPanelPosition={(a) => this.setCreateElementPanelPosition(a)}
                    updateConnection={(a, b) => this.updateEntity(a, b)}
                />
                {!data.readOnly &&
                    <CreateElementPanel
                        createElementPanelConnectorType={createElementPanelConnectorType}
                        x={createElementPanelPosition.x}
                        y={createElementPanelPosition.y}
                        type={createElementPanelPosition.type}
                        itemPosition={createElementPanelPosition.itemPosition}
                        connectorType={currentTechnicalItem ? currentTechnicalItem.connectorType : ''}
                        connection={connection}
                        isCreateElementPanelOpened={isCreateElementPanelOpened}
                        setCreateElementPanelPosition={(a) => this.setCreateElementPanelPosition(a)}
                        setIsCreateElementPanelOpened={(a, b) => this.setIsCreateElementPanelOpened(a, b)}
                        updateConnection={(a, b) => this.updateEntity(a, b)}
                    />
                }
                <LogPanel/>
            </div>
        );
    }
}

export default FormConnectionSvg;

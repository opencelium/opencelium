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

import React, {Component, useEffect} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {
    addConnection,
    checkConnectionTitle,
    updateConnection,
    testConnection, getConnectionWebhooks,
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {
    setCurrentTechnicalItem,
    setCurrentConnection,
    setTemplatePanelVisibility, setSavePanelVisibility
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {addTemplate, getTemplatesByConnectors as fetchTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {getAllConnectors as fetchConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {permission} from "@entity/application/utils/permission";
import {ConnectionForm} from "@entity/connection/components/components/content/connections/ConnectionForm";
import {useNavigate} from "react-router";
import {ConnectionPermissions} from "@entity/connection/constants";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {useAppDispatch} from "@application/utils/store";
import {getAllCategories} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const template = state.templateReducer
    const connector = state.connectorReducer;
    const connection = state.connectionReducer;
    const category = state.categoryReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        authUser,
        connection: connection.currentConnection,
        currentTechnicalItem,
        addingConnection: connection.addingConnection,
        testingConnection: connection.testingConnection,
        updatingConnection: connection.updatingConnection,
        error: connection.error,
        savingTemplate: template.addingTemplate,
        connectors: connector.connectors.map(connector => {return {...connector, id: connector.connectorId}}),
        fetchingConnectors: connector.gettingConnectors,
        checkingConnectionTitle: connection.checkingConnectionTitle,
        checkTitleResult: connection.isCurrentConnectionHasUniqueTitle,
        validatingFormMethods: connection.validatingFormMethods,
        validateFormMethodsResult: connection.validateFormMethodsResult,
        categories: category.categories
    };
}


/**
 * Component to Add Connection
 */
@connect(mapStateToProps, {
    updateConnection, addConnection, addTemplate, fetchConnectors, checkConnectionTitle,
    fetchTemplates, testConnection, setCurrentTechnicalItem, setCurrentConnection,
    setFullScreen,
})
@permission(ConnectionPermissions.CREATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@ConnectionForm('add')
class ConnectionAdd extends Component{}


export default function(props) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    useEffect(() => {
        return () => {
            dispatch(setTemplatePanelVisibility(false))
            dispatch(setSavePanelVisibility(false))
            dispatch(getAllCategories());
        }
    }, []);
    return <ConnectionAdd {...props} navigate={navigate} />;
}

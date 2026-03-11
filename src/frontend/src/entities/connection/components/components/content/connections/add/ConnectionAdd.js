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

import React, {Component, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {
    addConnection,
    checkConnectionTitle,
    updateConnection,
    testConnection, getConnectionWebhooks, getConnectionById as fetchConnection,
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {
    setCurrentTechnicalItem,
    setCurrentConnection, setConnection,
    setTemplatePanelVisibility, setSavePanelVisibility, setWebhooks, setIsDirty
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {setEntityHeader, setEntityIconKey, setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {addTemplate, getTemplatesByConnectors as fetchTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {getAllConnectors as fetchConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {permission} from "@entity/application/utils/permission";
import {ConnectionForm} from "@entity/connection/components/components/content/connections/ConnectionForm";
import {useNavigate} from "react-router";
import {ConnectionPermissions} from "@entity/connection/constants";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {useAppDispatch} from "@application/utils/store";
import {getAllCategories} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";
import {Application} from "@application/classes/Application";
import {Connection} from "@root/classes/Connection";
import {useConfirmLeave} from "@application/utils/hooks/useConfirmLeave";
import {useBlockNavigation} from "@application/utils/hooks/useBlockNavigation";
import {ContentLoading} from "@app_component/base/loading/ContentLoading";


function mapStateToProps(state){
    const isFullScreen = state.applicationReducer.isFullScreen;
    const authUser = state.authReducer.authUser;
    const template = state.templateReducer
    const connector = state.connectorReducer;
    const connection = state.connectionReducer;
    const category = state.categoryReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        isFullScreen,
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
        categories: category.categories,
        gettingCategories: category.gettingCategories,
        activeCategory: category.activeCategory,
        isButtonPanelOpened: connection.isButtonPanelOpened,
    };
}


/**
 * Component to Add Connection
 */
@connect(mapStateToProps, {
    updateConnection, addConnection, addTemplate, fetchConnectors, checkConnectionTitle,
    fetchTemplates, testConnection, setCurrentTechnicalItem, setCurrentConnection,
    setFullScreen, setConnection, setEntityIconKey, setEntityHeader, setIsDirty
})
@permission(ConnectionPermissions.CREATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@ConnectionForm('add')
class ConnectionAdd extends Component{}


export default function(props) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {
        entityIconKey,
    } = Application.getReduxState();
    const {isDirty, isButtonPanelOpened} = Connection.getReduxState();
    const [isLoading, setIsLoading] = useState(true);
    const entityKey = 'connection-form-with-panel';
    useConfirmLeave(isDirty);
    useBlockNavigation(isDirty);
    useEffect(() => {
        const entityKey = `connection-form-with${isButtonPanelOpened ? '' : 'out'}-panel`;
        if (entityIconKey !== entityKey) {
            dispatch(setEntityIconKey(entityKey));
        }
    }, [isButtonPanelOpened]);
    useEffect(() => {
        (async () => {
            try {
                await dispatch(fetchConnectors());
            } catch(e) {

            } finally {
                setIsLoading(false);
            }
        })()
        return () => {
            dispatch(setTemplatePanelVisibility(false))
            dispatch(setSavePanelVisibility(false))
            dispatch(setWebhooks([]));
            dispatch(setEntityHeader(''))
            dispatch(setEntityIconKey(''))
        }
    }, []);
    if (isLoading) {
        return <ContentLoading/>
    }
    return <ConnectionAdd {...props} entityIconKey={entityIconKey} navigate={navigate} />;
}

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

import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {
    updateConnection,
    checkConnectionTitle,
    getConnectionById as fetchConnection,
    testConnection,
    getConnectionWebhooks
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {addTemplate, getTemplatesByConnectors as fetchTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {getAllConnectors as fetchConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {permission} from "@entity/application/utils/permission";
import {ConnectionForm} from "@entity/connection/components/components/content/connections/ConnectionForm";
import {useNavigate} from "react-router";
import {useParams} from "react-router";
 import {ConnectionPermissions} from "@entity/connection/constants";
 import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
 import {
    setCurrentConnection,
    setCurrentTechnicalItem, setSavePanelVisibility,
     setTemplatePanelVisibility, setConnection,
 } from "@root/redux_toolkit/slices/ConnectionSlice";
 import {useAppDispatch} from "@application/utils/store";
 import {getAllCategories} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";

/*
* TODO: implement connection update
*/
function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const connection = state.connectionReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    const template = state.templateReducer;
    const connector = state.connectorReducer;
    return{
        authUser,
        connection: connection.currentConnection,
        currentTechnicalItem,
        fetchingConnection: connection.gettingConnection,
        updatingConnection: connection.updatingConnection,
        testingConnection: connection.testingConnection,
        error: connection.error,
        savingTemplate: template.addingTemplate,
        connectors: connector.connectors.map(connector => {return {...connector, id: connector.connectorId}}),
        fetchingConnectors: connector.gettingConnectors,
        checkingConnectionTitle: connection.checkingConnectionTitle,
        checkTitleResult: connection.isCurrentConnectionHasUniqueTitle,
        validatingFormMethods: connection.validatingFormMethods,
        validateFormMethodsResult: connection.validateFormMethodsResult,
    };
}


/**
 * Component to Update Connection
 */
@connect(mapStateToProps, {
    updateConnection, addTemplate, fetchConnection, fetchConnectors, checkConnectionTitle,
    fetchTemplates, testConnection, setCurrentTechnicalItem, setCurrentConnection,
    setFullScreen, getConnectionWebhooks, setConnection,
})
@permission(ConnectionPermissions.UPDATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@ConnectionForm('update')
class ConnectionUpdate extends Component{}


export default function(props) {
    const navigate = useNavigate();
    let urlParams = useParams();
    const dispatch = useAppDispatch();
    useEffect(() => {
        return () => {
            dispatch(setTemplatePanelVisibility(false))
            dispatch(setSavePanelVisibility(false))
            dispatch(getAllCategories());
        }
    }, []);
    return <ConnectionUpdate {...props} navigate={navigate} params={urlParams}/>;
}

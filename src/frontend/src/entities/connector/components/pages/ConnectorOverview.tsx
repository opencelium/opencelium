/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import {useParams} from "react-router";
import {permission} from "@application/utils/permission";
import {IForm} from "@application/interfaces/IForm";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import {Connector} from "../../classes/Connector";
import {IConnector} from "../../interfaces/IConnector";
import {ConnectorPermissions} from '../../constants';
import {General} from "../connector_overview/General";
import {Invoker} from "../connector_overview/Invoker";
import {ConnectorOverviewProps} from './interfaces';

const ConnectorOverview: FC<ConnectorOverviewProps> = permission<IForm>(ConnectorPermissions.READ)(({}) => {
    const {
        gettingConnector, currentConnector, error,
    } = Connector.getReduxState();
    let urlParams = useParams();
    const connectorId = parseInt(urlParams.id);
    const connector = Connector.createState<IConnector>({id: connectorId}, currentConnector);
    useEffect(() => {
        connector.getById()
    },[]);
    const data = {
        title: 'View Connector',
        actions: [
            <Button
                key={'connector_list'}
                label={'Connectors'}
                icon={'list_alt'}
                href={'/connectors'}
            />
        ],
        formSections: [
            <FormSection hasFullWidthInForm>
                <General connector={connector}/>
                <Invoker connector={connector}/>
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={gettingConnector === API_REQUEST_STATE.START}/>
    )
});

ConnectorOverview.defaultProps = {
}


export {
    ConnectorOverview,
};

export default withTheme(ConnectorOverview);
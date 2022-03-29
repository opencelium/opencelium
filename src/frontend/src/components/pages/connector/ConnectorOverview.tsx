import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import { ConnectorOverviewProps } from './interfaces';
import {permission} from "../../../decorators/permission";
import {IForm} from "@interface/application/IForm";
import {ConnectionPermissions} from "@constants/permissions";
import General from "@organism/connector_overview/General";
import {useParams} from "react-router";
import {Connector} from "@class/connector/Connector";
import {IConnector} from "@interface/connector/IConnector";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import FormComponent from "@organism/form/Form";
import FormSection from "@organism/form_section/FormSection";
import Button from "@atom/button/Button";
import Invoker from "@organism/connector_overview/Invoker";

const ConnectorOverview: FC<ConnectorOverviewProps> = permission<IForm>(ConnectionPermissions.READ)(({}) => {
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
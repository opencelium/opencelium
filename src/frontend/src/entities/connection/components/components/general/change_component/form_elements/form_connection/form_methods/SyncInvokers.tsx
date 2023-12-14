import React from 'react';
import {TextSize} from "@app_component/base/text/interfaces";
import Button from "@basic_components/buttons/Button";
import CConnection from "@classes/content/connection/CConnection";
import COperation from "@classes/content/invoker/COperation";
import {useAppDispatch} from "@application/utils/store";
import { syncInvokers } from '@entity/connection/redux_toolkit/slices/EditorSlice';
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import { ColorTheme } from '@style/Theme';


export default ({connection, updateConnection, connectors, tooltipButtonProps}: {connection: CConnection, updateConnection: any, connectors: any[], tooltipButtonProps: any}) => {
    const dispatch = useAppDispatch();
    const sync = () => {
        const fromConnector = connectors.find(c => c.connectorId === connection.fromConnector.id);
        const toConnector = connectors.find(c => c.connectorId === connection.toConnector.id);
        const fromInvoker = fromConnector ? fromConnector.invoker : null;
        const toInvoker = toConnector ? toConnector.invoker : null;
        for(let i = 0; i < connection.fromConnector.methods.length; i++){
            const operation = fromInvoker.operations.find((o: COperation) => o.name === connection.fromConnector.methods[i].name);
            if(operation){
                connection.fromConnector.methods[i].response = operation.response;
            }
        }
        for(let i = 0; i < connection.toConnector.methods.length; i++){
            const operation = toInvoker.operations.find((o: COperation) => o.name === connection.toConnector.methods[i].name);
            if(operation){
                connection.toConnector.methods[i].response = operation.response;
            }
        }
        updateConnection(connection);
        dispatch(syncInvokers())
    }

    return (
        <React.Fragment>
            {!tooltipButtonProps &&
                <Button
                    icon={'description'}
                    size={TextSize.Size_16}
                    hasConfirmation={true}
                    confirmationText={'Do you really want to sync connectors?'}
                    label={'Sync Connectors'}
                    onClick={sync}
                />
            }
            {tooltipButtonProps &&
                <TooltipButton
                    position={tooltipButtonProps.position}
                    icon={tooltipButtonProps.icon}
                    tooltip={tooltipButtonProps.tooltip}
                    target={tooltipButtonProps.target}
                    hasBackground={tooltipButtonProps.hasBackground}
                    background={ColorTheme.White}
                    color={ColorTheme.Gray}
                    padding={tooltipButtonProps.padding}
                    handleClick={() => sync()}
                />
            }
        </React.Fragment>
    )
}

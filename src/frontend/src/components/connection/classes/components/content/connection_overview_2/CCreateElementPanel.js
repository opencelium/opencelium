import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";

export const CREATE_PROCESS = 'CREATE_PROCESS';
export const CREATE_OPERATOR = 'CREATE_OPERATOR';

export default class CCreateElementPanel{
    static calculateXY(x, y, type, isOnTheTop) {
        let result = {x, y};
        let element = null;
        switch (type) {
            case CONNECTOR_FROM:
                element = document.getElementById(`${CONNECTOR_FROM}_panel_text`);
                break;
            case CONNECTOR_TO:
                element = document.getElementById(`${CONNECTOR_TO}_panel_text`);
                break;
            case 'business_layout':
                element = document.getElementById(`business_layout_empty_text`);
                break;
        }
        if (element) {
            const clientSvg = element.getBoundingClientRect();
            result.x = clientSvg.x;
            result.y = clientSvg.y;
        } else {
            result.x += 20;
            result.y += 100;
            if (isOnTheTop) {
                result.y -= 100;
            }
        }
        result.y += window.scrollY;
        return result;
    }

    static getLocationData(type){
        const isInBusinessLayout = CCreateElementPanel.isInBusinessLayout(type);
        const isInTechnicalFromConnectorLayout = CCreateElementPanel.isInTechnicalFromConnectorLayout(type);
        const isInTechnicalToConnectorLayout = CCreateElementPanel.isInTechnicalToConnectorLayout(type);
        return {
            isInBusinessLayout,
            isInTechnicalToConnectorLayout,
            isInTechnicalFromConnectorLayout,
            hasLocation: isInBusinessLayout || isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout,
        }
    }

    static isInBusinessLayout(type){
        return type === 'business_layout';
    }

    static isInTechnicalFromConnectorLayout(type){
        return type === CONNECTOR_FROM;
    }

    static isInTechnicalToConnectorLayout(type){
        return type === CONNECTOR_TO;
    }

    static getConnectorType(props){
        let {createElementPanelConnectorType, connectorType} = props;
        if(createElementPanelConnectorType === CONNECTOR_FROM || createElementPanelConnectorType === CONNECTOR_TO){
            connectorType = createElementPanelConnectorType;
        }
        return connectorType;
    }

    static getCoordinates(props){
        const {x, y, createElementPanelConnectorType, isOnTheTopLayout} = props;
        return CCreateElementPanel.calculateXY(x, y, createElementPanelConnectorType, isOnTheTopLayout);
    }
}
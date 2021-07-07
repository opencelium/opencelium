import {DETAILS_POSITION} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import CBusinessLayout from "@classes/components/content/connection_overview_2/CBusinessLayout";

export const COLOR_MODE = {
    RECTANGLE_TOP: 'RECTANGLE_TOP',
    BACKGROUND: 'BACKGROUND_COLOR',
    CIRCLE_LEFT_TOP: 'CIRCLE_LEFT_TOP',
};

export const BUSINESS_LABEL_MODE = {
    NOT_VISIBLE: 'NOT_VISIBLE',
    VISIBLE: 'VISIBLE',
    VISIBLE_ON_PRESS_KEY: 'VISIBLE_ON_PRESS_KEY'
};

export default class CSvg{

    static setViewBox(elementId, viewBox = {x: 0, y: 0, width: 0, height: 0}){
        const svgElement = document.getElementById(elementId);
        if(svgElement) {
            if (svgElement.viewBox.baseVal === null) {
                viewBox = {x: 0, y: 0, width: 0, height: 0, ...viewBox};
                svgElement.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
            } else {
                if(viewBox.x && svgElement.viewBox.baseVal.x !== viewBox.x) svgElement.viewBox.baseVal.x = viewBox.x;
                if(viewBox.y && svgElement.viewBox.baseVal.y !== viewBox.y) svgElement.viewBox.baseVal.y = viewBox.y;
                if(viewBox.width && svgElement.viewBox.baseVal.width !== viewBox.width) svgElement.viewBox.baseVal.width = viewBox.width;
                if(viewBox.height && svgElement.viewBox.baseVal.height !== viewBox.height) svgElement.viewBox.baseVal.height = viewBox.height;
            }
        }
    }

    static getStartingViewBoxX(detailsPosition){
        let x = -15;
        if(detailsPosition === DETAILS_POSITION.LEFT) x = -370;
        return x;
    }

    static getMousePosition(event, element){
        const CTM = element.getScreenCTM();
        return {
            x: (event.clientX - CTM.e) / CTM.a,
            y: (event.clientY - CTM.f) / CTM.d
        };
    }

    static resizeSVG(layoutId, svgId){
        const layout = document.getElementById(layoutId);
        if(layout) {
            const width = layout.offsetWidth;
            const height = layout.offsetHeight;
            CSvg.setViewBox(svgId, {width: width + 300, height: height + 300});
        }
    }

    static consoleBaseVal(prefix, suffix = ''){
        if(document.getElementById('technical_layout_svg'))
            if(document.getElementById('technical_layout_svg').viewBox.baseVal){
                console.log(prefix, document.getElementById('technical_layout_svg').viewBox.baseVal);
                if(suffix !== '') console.log(suffix);
            }
    }

    static isTechnicalItemAssigned(technicalItem, businessProcess){
        let isAssigned = false;
        if((technicalItem instanceof CTechnicalProcess || technicalItem instanceof CTechnicalOperator) && businessProcess instanceof CBusinessProcess){
            let index = businessProcess.items.findIndex(item => item.id === technicalItem.id);
            if(index !== -1){
                isAssigned = true;
            }
        }
        return isAssigned;
    }

    static isTechnicalItemDisabled(svgItem, businessLayout, isAssignMode){
        if(businessLayout instanceof CBusinessLayout) {
            const currentBusinessSvgItem = businessLayout.getCurrentSvgItem();
            if (isAssignMode) {
                if (svgItem instanceof CTechnicalProcess || svgItem instanceof CTechnicalOperator) {
                    let businessProcesses = businessLayout.getItems();
                    for (let i = 0; i < businessProcesses.length; i++) {
                        if (currentBusinessSvgItem && businessProcesses[i].id !== currentBusinessSvgItem.id) {
                            for (let j = 0; j < businessProcesses[i].items.length; j++) {
                                if (businessProcesses[i].items[j].id === svgItem.id) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            } else {
                if(currentBusinessSvgItem) {
                    const currentBusinessSvgItemItems = currentBusinessSvgItem.items;
                    return currentBusinessSvgItemItems.findIndex(item => item.id === svgItem.id) === -1;
                }
            }
        }
        return false;
    }

    static isBusinessItemDisabled(item, currentBusinessItem, isAssignMode){
        if(isAssignMode && item instanceof CBusinessProcess && item.id !== currentBusinessItem.id){
            return true;
        }
    }
}
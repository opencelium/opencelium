/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {DETAILS_POSITION} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CBusinessProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalOperator} from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import CBusinessLayout from "@entity/connection/components/classes/components/content/connection_overview_2/CBusinessLayout";

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

    static isTechnicalItemDisabled(svgItem, businessLayout){
        if(svgItem instanceof CTechnicalProcess || svgItem instanceof CTechnicalOperator) {
            if (businessLayout instanceof CBusinessLayout) {
                const currentBusinessSvgItem = businessLayout.getCurrentSvgItem();
                const isAssignMode = businessLayout.isInAssignMode;
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
                    if (currentBusinessSvgItem) {
                        const currentBusinessSvgItemItems = currentBusinessSvgItem.items;
                        return currentBusinessSvgItemItems.findIndex(item => item.id === svgItem.id) === -1;
                    }
                }
            }
        }
        return false;
    }

    static isBusinessItemDisabled(item, currentBusinessItem, isAssignMode){
        if(item instanceof CBusinessProcess && currentBusinessItem && isAssignMode && item.id !== currentBusinessItem.id){
            return true;
        }
        return false;
    }
}
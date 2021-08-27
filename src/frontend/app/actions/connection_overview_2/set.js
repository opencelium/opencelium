/*
 * Copyright (C) <2021>  <becon GmbH>
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

import {ConnectionOverview2Action} from "@utils/actions";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";


const setIsVisibleBusinessLabelKeyPressed = (isVisibleBusinessLabelKeyPressed) => {
    return{
        type: ConnectionOverview2Action.SET_ISVISIBLEBUSINESSLABELKEYPRESSED,
        payload: isVisibleBusinessLabelKeyPressed,
    };
}

const setPanelConfigurations = (configurations) => {
    return{
        type: ConnectionOverview2Action.SET_PANELCONFIGURATIONS,
        payload: configurations,
    };
}

const setBusinessLabelMode = (mode) => {
    return{
        type: ConnectionOverview2Action.SET_BUSINESSLABELMODE,
        payload: mode,
    };
}

const setColorMode = (color) => {
    return{
        type: ConnectionOverview2Action.SET_COLORMODE,
        payload: color,
    };
}
/**
 * set connection and updateConnection
 * @param connection
 * @param updateConnection
 * @returns {{type: string, payload: {}}}
 */
const setConnectionData = (connection = null, updateConnection = null) => {
    return {
        type: ConnectionOverview2Action.SET_CONNECTIONDATA,
        payload: {connection: typeof connection.getObjectForConnectionOverview === 'function' ? connection.getObjectForConnectionOverview() : connection, updateConnection},
    };
};
/**
 * set current item
 * @param currentBusinessItem - item
 * @returns {{type: string, payload: {}}}
 */
const setCurrentBusinessItem = (currentBusinessItem) => {
    return {
        type: ConnectionOverview2Action.SET_CURRENTBUSINESSITEM,
        payload: currentBusinessItem instanceof CProcess || currentBusinessItem instanceof COperator ? currentBusinessItem.getObject() : currentBusinessItem,
    };
};

/**
 * set current item
 * @param currentTechnicalItem - subItem
 * @returns {{type: string, payload: {}}}
 */
const setCurrentTechnicalItem = (currentTechnicalItem) => {
    const payload = currentTechnicalItem instanceof CProcess || currentTechnicalItem instanceof COperator ? currentTechnicalItem.getObject() : currentTechnicalItem;
    return {
        type: ConnectionOverview2Action.SET_CURRENTECHNICALITEM,
        payload: payload === null ? payload : {...payload},
    };
};

/**
 * set items
 * @param items
 * @returns {{type: string, payload: {}}}
 */
const setItems = (items) => {
    let convertedItems = [];
    if(items.length > 0 && (items[0] instanceof CProcess || items[0] instanceof COperator)){
        for(let i = 0; i < items.length; i++){
            convertedItems.push(items[i].getObject());
        }
    } else{
        convertedItems = items;
    }
    return {
        type: ConnectionOverview2Action.SET_ITEMS,
        payload: convertedItems,
    };
};

/**
 * set arrows
 * @param arrows
 * @returns {{type: string, payload: {}}}
 */
const setArrows = (arrows) => {
    return {
        type: ConnectionOverview2Action.SET_ARROWS,
        payload: arrows,
    };
};

/**
 * set details location: {PANEL_LOCATION}
 * @returns {{type: string, payload: {}}}
 */
const setDetailsLocation = (data) => {
    return {
        type: ConnectionOverview2Action.SET_DETAILSLOCATION,
        payload: data,
    };
};

/**
 * set business location: {PANEL_LOCATION}
 * @returns {{type: string, payload: {}}}
 */
const setBusinessLayoutLocation = (data) => {
    return {
        type: ConnectionOverview2Action.SET_BUSINESSLAYOUTLOCATION,
        payload: data,
    };
};

/**
 * set technical location: {PANEL_LOCATION}
 * @returns {{type: string, payload: {}}}
 */
const setTechnicalLayoutLocation = (data) => {
    return {
        type: ConnectionOverview2Action.SET_TECHNICALLAYOUTLOCATION,
        payload: data,
    };
};




export{
    setCurrentBusinessItem,
    setCurrentTechnicalItem,
    setArrows,
    setItems,
    setDetailsLocation,
    setBusinessLayoutLocation,
    setTechnicalLayoutLocation,
    setColorMode,
    setConnectionData,
    setBusinessLabelMode,
    setPanelConfigurations,
    setIsVisibleBusinessLabelKeyPressed,
};
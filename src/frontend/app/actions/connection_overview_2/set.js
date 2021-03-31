import {ConnectionOverview2Action} from "@utils/actions";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import {isObject} from "@utils/app";

/**
 * set current item
 * @param currentItem - item
 * @returns {{type: string, payload: {}}}
 */
const setCurrentItem = (currentItem) => {
    return {
        type: ConnectionOverview2Action.SET_CURRENTITEM,
        payload: isObject(currentItem) ? currentItem : currentItem.getObject(),
    };
};

/**
 * set current item
 * @param currentSubItem - subItem
 * @returns {{type: string, payload: {}}}
 */
const setCurrentSubItem = (currentSubItem) => {
    return {
        type: ConnectionOverview2Action.SET_CURRENTSUBITEM,
        payload: isObject(currentSubItem) ? currentSubItem : currentSubItem.getObject(),
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




export{
    setCurrentItem,
    setCurrentSubItem,
    setArrows,
    setItems,
    setDetailsLocation,
};
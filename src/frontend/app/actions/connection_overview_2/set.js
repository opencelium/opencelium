import {ConnectionOverview2Action} from "@utils/actions";

/**
 * set current item
 * @param currentItem - item
 * @returns {{type: string, payload: {}}}
 */
const setCurrentItem = (currentItem) => {
    return {
        type: ConnectionOverview2Action.SET_CURRENTITEM,
        payload: currentItem,
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
        payload: currentSubItem,
    };
};

/**
 * set items
 * @param items
 * @returns {{type: string, payload: {}}}
 */
const setItems = (items) => {
    return {
        type: ConnectionOverview2Action.SET_ITEMS,
        payload: items,
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


export{
    setCurrentItem,
    setCurrentSubItem,
    setArrows,
    setItems,
};
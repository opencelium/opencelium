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


export{
    setCurrentItem,
    setCurrentSubItem,
};
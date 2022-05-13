import {
    setArrows, setConnectionData,
    setCurrentBusinessItem,
    setCurrentTechnicalItem, setDetailsLocation,
    setItems
} from "../redux_toolkit/slices/ConnectionSlice";

const whiteList = [
    setItems.type,
    setArrows.type,
    setCurrentTechnicalItem.type,
    setCurrentBusinessItem.type,
    setDetailsLocation.type,
    setConnectionData.type,
]

export {
    whiteList,
}
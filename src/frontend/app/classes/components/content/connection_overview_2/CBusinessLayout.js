import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {isString} from "@utils/app";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";

export default class CBusinessLayout{

    constructor(connection = null, svgItems = [], arrows = [], currentSvgItem = null) {
        this._connection = connection;
        this._svgItems = this.convertItems(svgItems);
        this._arrows = arrows;
        this._currentSvgItem = null;
        if(isString(currentSvgItem)){
            this.setCurrentSvgItemByIndex(currentSvgItem);
        } else{
            this.setCurrentSvgItem(currentSvgItem);
        }
    }

    static createBusinessLayout(businessLayout){
        const connection = businessLayout && businessLayout.hasOwnProperty('connection') ? businessLayout.connection : null;
        const svgItems = businessLayout && businessLayout.hasOwnProperty('svgItems') ? businessLayout.svgItems : [];
        const arrows = businessLayout && businessLayout.hasOwnProperty('arrows') ? businessLayout.arrows : [];
        const currentSvgItem = businessLayout && businessLayout.hasOwnProperty('currentSvgItem') ? businessLayout.currentSvgItem : null;
        return new CBusinessLayout(connection, svgItems, arrows, currentSvgItem);
    }

    changeItemName(item, newName){
        if(item instanceof CBusinessProcess){
            const svgItemIndex = this._svgItems.findIndex(svgItem => svgItem.index === item.index);
            if(svgItemIndex !== -1){
                this._svgItems[svgItemIndex].name = newName;
            }
        }
    }

    convertItem(item){
        if(!(item instanceof CBusinessProcess)){
            let technicalItems = [];
            if(item && item.hasOwnProperty('items')) {
                for (let i = 0; i < item.items.length; i++) {
                    if(!(item.items[i] instanceof CTechnicalProcess) && !(item.items[i] instanceof CTechnicalOperator)) {
                        const id = item.items[i].id;
                        let technicalItem = null;
                        if (id.indexOf(CONNECTOR_FROM) === 0) {
                            technicalItem = this._connection.fromConnector.svgItems.find(svgItem => svgItem.id === id);
                        }
                        if (id.indexOf(CONNECTOR_TO) === 0) {
                            technicalItem = this._connection.toConnector.svgItems.find(svgItem => svgItem.id === id);
                        }
                        technicalItems.push(technicalItem);
                    } else{
                        technicalItems.push(item.items[i]);
                    }
                }
                item.items = technicalItems;
            }
            return CBusinessProcess.createBusinessProcess(item);
        }
        return item;
    }

    convertItems(items){
        let convertedItems = [];
        for(let i = 0; i < items.length; i++){
            convertedItems.push(this.convertItem(items[i]));
        }
        return convertedItems;
    }

    addItem(item){
        this._svgItems.push(this.convertItem(item));
    }

    removeItemByIndex(index){
        if(index >= 0 && index < this._svgItems.length) {
            this._svgItems.splice(index, 1);
        }
    }

    getItemByIndex(index){
        const svgItem = this._svgItems.find(item => item.index === index);
        if(svgItem) return svgItem;
        return null;
    }

    getItems(){
        return this._svgItems;
    }

    setItems(items){
        this._svgItems = this.convertItems(items);
    }

    clearItems(){
        this._svgItems = [];
    }

    addArrow(arrow){
        this._arrows.push(arrow);
    }

    setArrows(arrows){
        this._arrows = arrows;
    }

    clearArrows(){
        this._arrows = [];
    }

    setCurrentSvgItem(currentSvgItem){
        if(currentSvgItem instanceof CBusinessProcess){
            this._currentSvgItem = currentSvgItem;
        }
    }

    setCurrentSvgItemByIndex(index){
        const currentSvgItem = this._svgItems.find(svgItem => svgItem.index === index);
        this._currentSvgItem = currentSvgItem ? currentSvgItem : null;
    }

    getCurrentSvgItem(){
        return this._currentSvgItem;
    }

    getObject(){
        let svgItems = [];
        for(let i = 0; i < this._svgItems.length; i++){
            if(this._svgItems[i] instanceof CBusinessProcess) {
                svgItems.push(this._svgItems[i].getObject());
            }
        }
        return{
            svgItems,
            arrows: this._arrows,
        }
    }
}
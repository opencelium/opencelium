import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {isString} from "@utils/app";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";

export default class CBusinessLayout{

    constructor(connection = null, svgItems = [], arrows = [], currentSvgItemId = '') {
        this._connection = connection;
        this._svgItems = this.convertItems(svgItems);
        this._arrows = arrows;
        this._currentSvgItem = this.getCurrentSvgItemById(currentSvgItemId);
    }

    static createBusinessLayout(businessLayout){
        const connection = businessLayout && businessLayout.hasOwnProperty('connection') ? businessLayout.connection : null;
        const svgItems = businessLayout && businessLayout.hasOwnProperty('svgItems') ? businessLayout.svgItems : [];
        const arrows = businessLayout && businessLayout.hasOwnProperty('arrows') ? businessLayout.arrows : [];
        const currentSvgItemId = businessLayout && businessLayout.hasOwnProperty('currentSvgItemId') ? businessLayout.currentSvgItemId : '';
        return new CBusinessLayout(connection, svgItems, arrows, currentSvgItemId);
    }

    changeItemName(item, newName){
        if(item instanceof CBusinessProcess){
            const svgItemIndex = this._svgItems.findIndex(svgItem => svgItem.id === item.id);
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

    refreshIds(startFromId){
        if(startFromId < this._svgItems.length) {
            for (let i = startFromId; i < this._svgItems.length; i++) {
                this._svgItems[i].id = i;
                if (i > 0) {
                    this._arrows[i - 1] = {from: i - 1, to: i};
                }
            }
        }
    }

    addItem(item){
        let id = 0;
        let arrow = null;
        if(this._currentSvgItem !== null) {
            id = this._currentSvgItem.id + 1;
            arrow = {from: this._currentSvgItem.id, to: this._currentSvgItem.id + 1};
            this._arrows.push(arrow);
        }
        this._svgItems.splice(id, 0, this.convertItem({...item, id}));
        this._currentSvgItem = this._svgItems[id];
        this.refreshIds(id);
    }

    deleteItem(item){
        const index = this._svgItems.findIndex(svgItem => svgItem.id === item.id);
        if(index !== -1){
            this._svgItems.splice(index, 1);
            if(index > 0){
                this._currentSvgItem = this._svgItems[index - 1];
                this.refreshIds(index - 1);
            } else{
                this._currentSvgItem = null;
            }
        }
    }

    getItemByTechnicalItem(technicalItem){
        if(technicalItem instanceof CTechnicalProcess || technicalItem instanceof CTechnicalOperator){
            const item = this._svgItems.find(svgItem => svgItem.items.findIndex(elem => elem.id === technicalItem.id) !== -1);
            if(item) return item;
        }
        return null;
    }

    getItemById(id){
        const svgItem = this._svgItems.find(item => item.id === id);
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

    getArrows(){
        return this._arrows;
    }

    clearArrows(){
        this._arrows = [];
    }

    isTechnicalItemAssigned(technicalProcess){
        for(let i = 0; i < this._svgItems.length; i++){
            for(let j = 0; j < this._svgItems[i].items.length; j++){
                if(technicalProcess.id === this._svgItems[i].items[j].id){
                    return this._svgItems[i];
                }
            }
        }
        return false;
    }

    setCurrentSvgItem(currentSvgItem){
        if(currentSvgItem instanceof CBusinessProcess || currentSvgItem === null){
            this._currentSvgItem = currentSvgItem;
        }
    }

    getCurrentSvgItemById(id){
        const currentSvgItem = this._svgItems.find(svgItem => svgItem.id === id);
        return currentSvgItem ? currentSvgItem : null;
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
            currentSvgItemId: this._currentSvgItem ? this._currentSvgItem.id : '',
        }
    }
}
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";

export class CBusinessProcess extends CProcess{

    constructor(businessProcess) {
        super(businessProcess);
        this._items = businessProcess && businessProcess.hasOwnProperty('items') ? this.convertItems(businessProcess.items) : [];
        this._arrows = businessProcess && businessProcess.hasOwnProperty('arrows') ? businessProcess.arrows : [];
    }

    static createBusinessProcess(process){
        return new CBusinessProcess(process);
    }

    convertItems(items){
        return items.map(item => {
            if(item instanceof CTechnicalProcess || item instanceof CTechnicalOperator){
                return item;
            } else{
                if(item.hasOwnProperty('type')){
                    return CTechnicalOperator.createTechnicalOperator(item);
                } else{
                    return CTechnicalProcess.createTechnicalProcess(item);
                }
            }
        });
    }

    get items(){
        return this._items;
    }

    set items(items){
        this._items = this.convertItems(items);
    }

    get arrows(){
        return this._arrows;
    }

    set arrows(arrows){
        this._arrows = arrows;
    }

    getObject(){
        let data = super.getObject();
        let objectItems = [];
        if(this._items.length > 0){
            if(this._items[0] instanceof CTechnicalProcess || this._items[0] instanceof CTechnicalOperator){
                for(let i = 0; i < this._items.length; i++){
                    objectItems.push(this._items[i].getObject());
                }
            }
        }
        return{
            ...data,
            items: objectItems,
            arrows: this._arrows,
        }
    }
}
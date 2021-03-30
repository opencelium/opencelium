import COperator from "@classes/components/content/connection_overview_2/operator/COperator";

export class CTechnicalOperator extends COperator{

    constructor(businessOperator) {
        super(businessOperator);
        this._items = businessOperator && businessOperator.hasOwnProperty('items') ? businessOperator.items : [];
        this._arrows = businessOperator && businessOperator.hasOwnProperty('arrows') ? businessOperator.arrows : [];
    }

    static createTechnicalOperator(operator){
        return new CTechnicalOperator(operator);
    }

    get items(){
        return this._items;
    }

    set items(items){
        this._items = items;
    }

    get arrows(){
        return this._arrows;
    }

    set arrows(arrows){
        this._arrows = arrows;
    }

    getObject(){
        let data = super.getObject();
        return{
            ...data,
            items: this._items,
            arrows: this._arrows,
        }
    }
}
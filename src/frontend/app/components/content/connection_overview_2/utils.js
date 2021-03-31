import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";

export function mapItemsToClasses(state){

    const connectionOverview = state.get('connection_overview');
    let currentItem = connectionOverview.get('currentItem');
    if(currentItem !== null && (!(currentItem instanceof CBusinessProcess) || !(currentItem instanceof CBusinessOperator))){
        if(currentItem.hasOwnProperty('type')){
            currentItem = CBusinessOperator.createBusinessOperator(currentItem);
        } else{
            currentItem = CBusinessProcess.createBusinessProcess(currentItem);
        }
    }
    let currentSubItem = connectionOverview.get('currentSubItem');
    if(currentSubItem !== null && (!(currentSubItem instanceof CTechnicalProcess) || !(currentSubItem instanceof CTechnicalOperator))){
        if(currentSubItem.hasOwnProperty('type')){
            currentSubItem = CTechnicalOperator.createTechnicalOperator(currentSubItem);
        } else{
            currentSubItem = CTechnicalProcess.createTechnicalProcess(currentSubItem);
        }
    }
    let items = connectionOverview.get('items');
    let instancesItems = [];
    if(items.length > 0){
        if(!(items[0] instanceof CBusinessProcess || items[0] instanceof CBusinessOperator)){
            for(let i = 0; i < items.length; i++){
                if(items[i].hasOwnProperty('type')){
                    instancesItems.push(CBusinessOperator.createBusinessOperator(items[i]));
                } else{
                    instancesItems.push(CBusinessProcess.createBusinessProcess(items[i]));
                }
            }
        }
    }
    return {
        currentItem,
        currentSubItem,
        items: instancesItems,
    }
}
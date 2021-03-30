import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import {isString} from "@utils/app";

export class CTechnicalProcess extends CProcess{

    constructor(technicalProcess) {
        super(technicalProcess);
        this._label = technicalProcess && technicalProcess.hasOwnProperty('label') && isString(technicalProcess.label) ? technicalProcess.label : '';
    }

    static createTechnicalProcess(process){
        return new CTechnicalProcess(process);
    }

    get label(){
        return this._label;
    }

    set label(label){
        this._label = label;
    }

    getObject(){
        let data = super.getObject();
        return{
            ...data,
            label: this._label,
        }
    }
}
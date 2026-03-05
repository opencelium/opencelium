import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {Step} from "react-joyride";

export default class NotEqual extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotEqual})
    }

    getTourSteps(): Step[] {
        const steps = super.getTourSteps();
        return steps.map(s => ({...s, title: 'Not Equal'}))
    }
}
